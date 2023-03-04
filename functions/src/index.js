const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const {
  getFirestore,
  Timestamp,
  FieldValue,
  arrayUnion,
  arrayRemove,
} = require('firebase-admin/firestore');
const { parseISO, isAfter } = require('date-fns');

// admin.initializeApp();
initializeApp();
const db = getFirestore();

const API_KEY = functions.config().tmdb.key;

//
// db retrieval functions
//

const getFirebaseDoc = async (collection, doc) => {
  return db
    .collection(collection)
    .doc(doc)
    .get()
    .then((document) => {
      if (!(document && document.exists)) throw Error(`--> /${collection}/${doc} doesn't exist`);
      return document.data();
    })
    .then((data) => {
      return { ...data };
    });
};

// retrieve "specials/latest" doc
const getLatestSpecialsData = async () => {
  return getFirebaseDoc('specials', 'latest');
};

// retrieve "/specials/latest" doc
const getUpcomingSpecialsData = async () => {
  return getFirebaseDoc('specials', 'upcoming');
};

// retrieve "/comedians/latest" doc
const getLatestComediansData = async () => {
  return getFirebaseDoc('comedians', 'latest');
};

//
// user favorites handling
//

exports.toggleUserFavorite = functions.https.onCall(async (data, context) => {
  const userId = context.auth.uid;
  const favoriteId = data.favoriteId;
  const [newFavoriteCategory, newFavoriteId] = favoriteId.split('-');

  const userDocRef = db.collection('users').doc(userId);
  const userDocResponse = await userDocRef.get();
  const userDocData = userDocResponse.data();
  const userDocFavoritesArr = userDocData.favorites;

  // depending on the arguments: /comedians/all or /specials/all
  const allContentDocRef = db.collection(newFavoriteCategory).doc('all');

  if (userDocFavoritesArr.includes(favoriteId)) {
    // remove favorite from /users/.../favorites: []
    userDocRef.set({ favorites: FieldValue.arrayRemove(favoriteId) }, { merge: true });
    // update favorite count: /.../all/id: {favorites: # }
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(-1),
        },
      },
      { merge: true },
    );
    // TODO: Remove favorite count from topFavorites if present
    // ! on removal of a favorite, /category/all is NOT checked for a new potential top favorite
  } else {
    // add favorite from /users/.../favorites: []
    userDocRef.set({ favorites: FieldValue.arrayUnion(favoriteId) }, { merge: true });
    // update favorite count: /.../all/id: {favorites: # }
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(1),
        },
      },
      { merge: true },
    );
  }
  //
  // top favorites
  //

  const topFavoritesLimit = 10;

  // TODO might need to move topFavorites functionality to a function that runs on an interval to prevent excessive calls

  // after updating the favorite count for the content, retrieve it's new favorite count & data
  const contentDocResponse = await allContentDocRef.get();
  const contentDocData = await contentDocResponse.data();
  const updatedContentData = contentDocData[newFavoriteId];
  const updatedFavoriteCount = updatedContentData['favorites'];

  // remove timestamp values from data passed in from function call (comedians only)
  // --- dateAdded: { nanoseconds, seconds }
  let newFavoriteData = data.data;
  if ('dateAdded' in newFavoriteData) delete newFavoriteData['dateAdded'];

  getTopFavoritesForCategory(newFavoriteCategory)
    .then((data) => {
      let topFavorites = data;
      const numberOfTopFavorites = Object.keys(topFavorites).length;

      // if the top favorite limit of 10 hasn't been reached yet, add the new favorite
      if (numberOfTopFavorites < topFavoritesLimit) {
        db.collection(newFavoriteCategory)
          .doc('topFavorites')
          .set({ ...topFavorites, [newFavoriteId]: { ...updatedContentData } });
        return;
      }

      console.log('top favorite limit reached: determine if new fav in the top favorite counts');

      const leastFavoriteOfTopTen = Object.keys(topFavorites).reduce((leastFav, current) => {
        const currentCount = topFavorites[current].favorites;
        const currentId = topFavorites[current].id;
        if (leastFav === null) return { id: currentId, count: currentCount };

        return leastFav.count > currentCount
          ? {
              id: currentId,
              count: currentCount,
            }
          : { id: leastFav.id, count: leastFav.count };
      }, null);

      // if not a new topFavorite, quit here
      // note: if equal to the least favorite, newer content is preferred
      if (updatedFavoriteCount < leastFavoriteOfTopTen.count) {
        console.log('NOT a new top favorite');
        return;
      }

      console.log('IS A NEW TOP favorite entry!');

      // new favorite is in the top ten & topFavorite count >= topFavoriteLimit
      // out with the old:
      delete topFavorites[leastFavoriteOfTopTen.id];

      // in with the new:
      topFavorites = {
        ...topFavorites,
        [newFavoriteId]: { ...updatedContentData },
      };

      // update the top ten
      db.collection(newFavoriteCategory).doc('topFavorites').set(topFavorites);
    })
    .catch((error) => {
      console.log(error);
      // topFavorites doesn't exist in the db
      db.collection(newFavoriteCategory)
        .doc('topFavorites')
        .set({ [newFavoriteId]: { ...newFavoriteData, favorites: 1 } });
    });
});

const getTopFavoritesForCategory = async (category) => {
  return getFirebaseDoc(category, 'topFavorites');
};

//
// add comedian & their specials to the db.
//

exports.addComedianAndSpecials = functions.https.onCall(async (data, context) => {
  const { id } = data;
  if (!id) return;

  const specialsRawData = await fetchTmdbSpecialsData(id);
  const comedianRawData = await fetchTmdbComedianData(id);

  if (
    !comedianRawData.id ||
    comedianRawData.success === false ||
    specialsRawData.success === false
  ) {
    throw new functions.https.HttpsError(
      'Fail',
      `Unable to add the comedian at this time. Something went wrong when fetching TMDB data for Person ID #${id}`,
    );
  }

  return addComedianPageDoc(comedianRawData, specialsRawData)
    .then(() => addSpecialsPageDocs(comedianRawData, specialsRawData))
    .then(() => addComedianToAllComediansDoc(comedianRawData))
    .then(() => addComedianToLatestComediansDoc(comedianRawData))
    .then(() => addSpecialsToAllSpecialsDoc(specialsRawData))
    .then(() => addSpecialsToLatestAndUpcomingSpecialsDocs(specialsRawData))
    .catch((error) => {
      console.log(error);
      throw new functions.https.HttpsError(
        'Something went wrong while setting up the new comedian database entries.',
        {
          ...error,
        },
      );
    });
});

//
// firestore: /comedianPages/{comedianId}/
//

const addComedianPageDoc = (comedianRawData, specialsRawData) => {
  const comedian = {
    name: comedianRawData.name,
    id: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
    biography: comedianRawData.biography,
    birthday: comedianRawData.birthday,
    imdb_id: comedianRawData.imdb_id,
  };
  const categorizedContent = specialsRawData.reduce(
    (prev, special) => {
      if (isSpecial(comedianRawData.name, special.title)) {
        return {
          ...prev,
          specials: {
            ...prev.specials,
            [special.id]: {
              id: special.id,
              title: special.title,
              poster_path: special.poster_path,
              backdrop_path: special.backdrop_path,
              release_date: special.release_date,
            },
          },
        };
      } else if (isAppearance(comedianRawData.name, special.title)) {
        return {
          ...prev,
          appearances: {
            ...prev.appearances,
            [special.id]: {
              id: special.id,
              title: special.title,
              poster_path: special.poster_path,
              backdrop_path: special.backdrop_path,
              release_date: special.release_date,
            },
          },
        };
      } else {
        return prev;
      }
    },
    { specials: {}, appearances: {} },
  );
  const pageData = {
    personalData: { ...comedian },
    ...categorizedContent,
  };
  const comedianId = comedianRawData.id;
  return db.collection('comedianPages').doc(comedianId.toString()).set(pageData);
};

//
// firestore: /specialPages/{id}
//

const addSpecialsPageDocs = async (comedianRawData, specialsRawData) => {
  const comedian = {
    comedian: comedianRawData.name,
    comedianId: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
  };

  const specials = specialsRawData.reduce((prev, special, index) => {
    // each special page features the details of the special
    // and provides links to other specials by the same comedian

    const otherSpecialsByComedian = specialsRawData
      .filter((x, i) => i !== index)
      .map((other) => {
        return {
          id: other.id,
          title: other.title,
          release_date: other.release_date,
          poster_path: other.poster_path,
          backdrop_path: other.backdrop_path,
        };
      });

    return {
      ...prev,
      [special.id]: {
        comedian: {
          name: comedianRawData.name,
          id: comedianRawData.id,
          profile_path: comedianRawData.profile_path,
        },
        data: {
          id: special.id,
          title: special.title,
          ...(special.poster_path && { poster_path: special.poster_path }),
          ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
          ...(special.runtime && { runtime: special.runtime }),
          ...(special.status && { status: special.status }),
          ...(special.overview && { overview: special.overview }),
          ...(special.homepage && { homepage: special.homepage }),
          ...(special.release_date && { release_date: special.release_date }),
          ...(isSpecial(comedianRawData.name, special.title) && { type: 'special' }),
          ...(isAppearance(comedianRawData.name, special.title) && { type: 'appearance' }),
        },
        otherContent: otherSpecialsByComedian,
      },
    };
  }, {});
  const batch = db.batch();
  for (const special in specials) {
    const pageData = {
      ...comedian,
      ...specials[special],
    };
    const docRef = db.collection('specialPages').doc(special);
    batch.set(docRef, pageData);
  }
  return await batch.commit();
};

//
// firestore: /comedians/all
//

const addComedianToAllComediansDoc = (comedianRawData) => {
  const comedian = {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
      favorites: 0,
    },
  };
  return db.collection('comedians').doc('all').set(comedian, { merge: true });
};

//
// firestore: /specials/all
//

const addSpecialsToAllSpecialsDoc = (specialsRawData) => {
  const specials = specialsRawData.reduce((prev, special) => {
    return {
      ...prev,
      [special.id]: {
        id: special.id,
        title: special.title,
        poster_path: special.poster_path,
        backdrop_path: special.backdrop_path,
        release_date: special.release_date,
        favorites: 0,
      },
    };
  }, {});
  return db.collection('specials').doc('all').set(specials, { merge: true });
};

//
// firestore: /comedians/latest
//

// add comedian to /comedians/latest & restrict latest count to a finite #
const addComedianToLatestComediansDoc = async (comedianRawData) => {
  const comedian = {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
      dateAdded: FieldValue.serverTimestamp(),
    },
  };
  let latestComedians = await getLatestComediansData().catch(() => {
    return {};
  });
  latestComedians = { ...latestComedians, ...comedian };
  const latestTenComedians = reduceLatestCountToNum(latestComedians, 10, 'dateAdded');
  return db.collection('comedians').doc('latest').set(latestTenComedians);
};

//
// firestore: /specials/latest & /specials/upcoming
//

// add recently released specials to /specials/latest & upcoming specials to /specials/upcoming
const addSpecialsToLatestAndUpcomingSpecialsDocs = async (specialsRawData) => {
  const specials = specialsRawData.reduce((prev, special) => {
    return {
      ...prev,
      [special.id]: {
        id: special.id,
        title: special.title,
        poster_path: special.poster_path,
        backdrop_path: special.backdrop_path,
        release_date: special.release_date,
      },
    };
  }, {});
  let latest = await getLatestSpecialsData().catch(() => {
    return {};
  });
  let upcoming = await getUpcomingSpecialsData().catch(() => {
    return {};
  });
  // for each special, check the dateField
  // - if not released yet, add to /specials/upcoming
  // - if newer than one of the latest 10, add to /specials/latest
  for (const specialId in specials) {
    const specialData = specials[specialId];
    const isNotReleasedYet = isSpecialNotOutYet(specialData);
    if (isNotReleasedYet) {
      upcoming = {
        ...upcoming,
        [specialId]: specialData,
      };
    } else {
      const isALatestRelease = isSpecialALatestRelease(specialData, latest);
      if (isALatestRelease) {
        latest = {
          ...latest,
          [specialId]: specialData,
        };
      }
    }
  }
  const latestTenSpecials = reduceLatestCountToNum(latest, 10, 'release_date');
  return db
    .collection('specials')
    .doc('latest')
    .set(latestTenSpecials)
    .then(() => db.collection('specials').doc('upcoming').set(upcoming));
};

const isSpecial = (comedianName, title) => {
  const [firstName, lastName] = comedianName.split(' ');
  const titlePrefix = title.split(':')[0];
  const isSpecial = title.includes(firstName) && title.includes(lastName);
  const isAppearance = titlePrefix.includes('Presents');
  return isSpecial && !isAppearance ? true : false;
};

const isAppearance = (comedianName, title) => {
  const [firstName, lastName] = comedianName.split(' ');
  const titlePrefix = title.split(':')[0];
  const isAppearance =
    titlePrefix.includes('Presents') ||
    !(titlePrefix.includes(firstName) && titlePrefix.includes(lastName));
  return isAppearance ? true : false;
};

// returns true if special's release date is after today's date
const isSpecialNotOutYet = (special) => {
  const specialDate = parseISO(special.release_date);
  const today = new Date();
  return isAfter(specialDate, today) ? true : false;
};

// returns true if a special's date is after one of the latest specials dates
const isSpecialALatestRelease = (special, latestSpecialsObj) => {
  const specialDate = parseISO(special.release_date);
  // when /specials/latest is empty, accept any special as a latest release
  if (!latestSpecialsObj || Object.keys(latestSpecialsObj).length === 0) return true;
  for (const existingSpecial in latestSpecialsObj) {
    const existingDate = parseISO(latestSpecialsObj[existingSpecial].release_date);
    const isMoreRecent = isAfter(specialDate, existingDate);
    if (isMoreRecent) {
      isALatestSpecial = true;
      return true;
    }
  }
  return false;
};

// given a object of comedians or specials, sort by "dateField" &
// limit the results to "num"
const reduceLatestCountToNum = (dataObj, num, dateField) => {
  const array = [];
  for (const data in dataObj) {
    array.push(dataObj[data]);
  }
  return array
    .sort((a, b) => {
      const aDate = parseISO(a[dateField]);
      const bDate = parseISO(b[dateField]);
      return isAfter(aDate, bDate) ? -1 : 1;
    })
    .splice(0, num)
    .reduce((prev, curr) => {
      return { ...prev, [curr.id]: { ...curr } };
    }, {});
};

//
// tmdb-related functions
//

const fetchTmdbComedianData = async (comedianId) => {
  const comedianUrl = getPersonDetailsURL(comedianId);
  const comedianData = await fetchData(comedianUrl);
  return comedianData;
};

const fetchTmdbSpecialsData = async (comedianId) => {
  const specialsUrl = getAllSpecialsForPersonURL(comedianId);
  const { results: specialsData } = await fetchData(specialsUrl);
  return specialsData;
};

const getAllSpecialsForPersonURL = function (personId) {
  return `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_keywords=9716&with_cast=${personId}`;
};

const getPersonDetailsURL = function (personId) {
  return `https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}`;
};

const fetchData = async function (url) {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (err) {
    return err;
  }
};
