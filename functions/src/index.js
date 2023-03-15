const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { parseISO, isAfter } = require('date-fns');

initializeApp();
const db = getFirestore();
const API_KEY = functions.config().tmdb.key;

// fetch new specials for all comedians & update top favorite calculations
const maintenanceSchedule = 'every 24 hours';

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
// user favorite toggling
// - updates personal favorites: /users/{userId}/favorites: [] array
// - updates content favorite count: /comedians/all/{comedianId}: favorites: +/-1; (or /specials/all)
//

exports.toggleUserFavorite = functions.https.onCall(async (data, context) => {
  // for testing purposes:
  // db.collection('specials')
  //   .doc('all')
  //   .update({
  //     1043110: FieldValue.delete(),
  //     150879: FieldValue.delete(),
  //   })
  //   .then(async () => {
  //     await getNewSpecialsForAllComedians();
  //     console.log('test complete');
  //   });
  // return;

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  // favoriteId: "category-tmdbId" (ie: "comedians-123456789", "specials-123456789")
  const favoriteId = data.favoriteId;
  const [category, tmdbId] = favoriteId.split('-');

  const userDocRef = db.collection('users').doc(userId);
  const userDocResponse = await userDocRef.get();
  const userDocData = userDocResponse.data();
  const userDocFavoritesArr = userDocData.favorites;

  // /comedians/all or /specials/all
  const contentAllDocRef = db.collection(category).doc('all');

  if (userDocFavoritesArr.includes(favoriteId)) {
    // remove favorite from /users/.../favorites: []
    userDocRef.set({ favorites: FieldValue.arrayRemove(favoriteId) }, { merge: true });
    // update content's favorite count: /{comedians/specials}/all/id: {favorites: # }
    contentAllDocRef.set(
      {
        [tmdbId]: {
          favorites: FieldValue.increment(-1),
        },
      },
      { merge: true },
    );

    if (category === 'comedians') unsubscribeUserToComedian(userId, userEmail, tmdbId);
  } else {
    // add favorite from /users/.../favorites: []
    userDocRef.set({ favorites: FieldValue.arrayUnion(favoriteId) }, { merge: true });
    // update content's favorite count: /{comedians/specials}/all/id: {favorites: # }
    contentAllDocRef.set(
      {
        [tmdbId]: {
          favorites: FieldValue.increment(1),
        },
      },
      { merge: true },
    );
    if (category === 'comedians') subscribeUserToComedian(userId, userEmail, tmdbId);
  }
});

const subscribeUserToComedian = async (userId, userEmail, comedianId) => {
  console.log(`Subscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  comedianSubscribersDocRef.set(
    {
      [userId]: {
        id: userId,
        email: userEmail,
      },
    },
    { merge: true },
  );
};

const unsubscribeUserToComedian = async (userId, userEmail, comedianId) => {
  console.log(`Unsubscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  comedianSubscribersDocRef.update({
    [userId]: FieldValue.delete(),
  });
};

//
// update top favorite comedians & specials on a schedule
//

exports.updateTopFavorites = functions.pubsub.schedule(maintenanceSchedule).onRun(async () => {
  const topComediansLimit = 10;
  const topSpecialsLimit = 10;

  const getNewTopFavorites = (allComediansOrAllSpecialsDocData, favoriteCountLimit) => {
    return Object.keys(allComediansOrAllSpecialsDocData)
      .map((id) => {
        const data = allComediansOrAllSpecialsDocData[id];
        return { ...data };
      })
      .sort((a, b) => (a.favorites < b.favorites ? 1 : -1))
      .splice(0, favoriteCountLimit)
      .reduce((prev, curr) => {
        return {
          ...prev,
          [curr.id]: {
            ...curr,
          },
        };
      }, {});
  };

  const comediansAllDocData = await getFirebaseDoc('comedians', 'all');
  const specialsAllDocData = await getFirebaseDoc('specials', 'all');

  const updatedTopComediansData = getNewTopFavorites(comediansAllDocData, topComediansLimit);
  const updatedTopSpecialsData = getNewTopFavorites(specialsAllDocData, topSpecialsLimit);

  db.collection('comedians')
    .doc('topFavorites')
    .set(updatedTopComediansData)
    .then(() =>
      db
        .collection('specials')
        .doc('topFavorites')
        .set(updatedTopSpecialsData)
        .then(() => {
          console.log('Successfully updated top favorites');
        })
        .catch((e) => {
          console.log('Failed to update top favorites.');
          console.log(e);
        }),
    );

  return null;
});

//
// scheduled function: get new specials for all comedians
//

exports.getNewSpecialsForAllComedians = functions.pubsub
  .schedule(maintenanceSchedule)
  .onRun(async () => {
    await getNewSpecialsForAllComedians();
  });

const getNewSpecialsForAllComedians = async () => {
  const allComediansDocData = await getFirebaseDoc('comedians', 'all');
  const allSpecialsDocData = await getFirebaseDoc('specials', 'all');
  const allComedianIds = Object.keys(allComediansDocData);
  const allExistingSpecialIds = Object.keys(allSpecialsDocData);

  for (const comedianId of allComedianIds) {
    const specialsRawData = await fetchTmdbSpecialsData(comedianId);
    // determine if the comedian has any new specials
    const newSpecials = specialsRawData.filter((newSpecial) => {
      return allExistingSpecialIds.some(
        (existingSpecialId) => Number(newSpecial.id) === Number(existingSpecialId),
      )
        ? false
        : true;
    });

    // if no new specials are available, stop here.
    if (newSpecials.length === 0) return;

    // comedian has new specials
    try {
      // get fresh data for the comedian's page
      const comedianRawData = await fetchTmdbComedianData(comedianId);
      console.log(`${comedianRawData.name} has ${newSpecials.length} new specials!`);

      // add only new specials to /specials/all
      // this prevents overwriting existing favorite counts (set to 0 on being added)
      await addSpecialsToAllSpecialsDoc(newSpecials);

      // add only new specials to .../upcoming and .../latest if applicable
      // existing specials in the db have already been checked
      await addSpecialsToLatestAndUpcomingSpecialsDocs(newSpecials);

      // update /comedianPages/{comedianId}/
      await addComedianPageDoc(comedianRawData, specialsRawData);

      // update all /specialPages/ related to comedian
      await addSpecialsPageDocs(comedianRawData, specialsRawData);

      // create notifications for all users who like this comedian
      await createAllUserNotifications(comedianRawData, newSpecials);

      console.log(`Successfully updated with ${comedianRawData.name}'s new specials!`);
    } catch (e) {
      console.log(`Failed to add ${comedianRawData.name}'s new specials`);
      console.error(e);
    }
  }
  return null;
};

//
// notifications are created after fetching new specials data for all comedians
// - stored in: /users/{uid}/notifications: []
//

const createAllUserNotifications = async (comedianRawData, newSpecials) => {
  newSpecials.forEach(async (specialRawData) => {
    const comedianId = comedianRawData.id;

    // get all users subscribed to this comedian
    const comedianSubscribersDocRef = db
      .collection('comedianSubscribers')
      .doc(comedianId.toString());
    const comedianSubscribersDocResponse = await comedianSubscribersDocRef.get();

    // if no users are subscribed to this comedian, stop here.
    if (!comedianSubscribersDocResponse.exists) return;

    const comedianSubscribersData = await comedianSubscribersDocResponse.data();
    const userIds = Object.keys(comedianSubscribersData);

    for (const uid of userIds) {
      try {
        await createUserNotification(uid, comedianRawData, specialRawData);
      } catch (e) {
        console.error(`Unable to create notification for ${uid}\n${e}`);
      }
    }
  });
};

const createUserNotification = async (userId, comedianRawData, specialRawData) => {
  // console.log('Creating notification object');
  const notification = {
    comedian: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
    },
    data: {
      id: specialRawData.id,
      title: specialRawData.title,
      poster_path: specialRawData.poster_path,
      backdrop_path: specialRawData.backdrop_path,
      release_date: specialRawData.release_date,
    },
  };

  return await db
    .collection('users')
    .doc(userId)
    .update({
      notifications: FieldValue.arrayUnion(notification),
    });
};

//
// add comedian & their specials to the db: triggered by client
//

exports.addComedianAndSpecials = functions.https.onCall(async (data) => {
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
