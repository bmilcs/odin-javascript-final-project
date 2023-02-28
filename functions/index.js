const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
  arrayUnion,
  arrayRemove,
} = require("firebase-admin/firestore");
const { parseISO, isAfter } = require("date-fns");

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
      if (!(document && document.exists))
        throw Error(`--> /${collection}/${doc} doesn't exist`);
      return document.data();
    })
    .then((data) => {
      return { ...data };
    });
};

// retrieve "specials/latest" doc
const getLatestSpecialsData = async () => {
  return getFirebaseDoc("specials", "latest");
};

// retrieve "/specials/latest" doc
const getUpcomingSpecialsData = async () => {
  return getFirebaseDoc("specials", "upcoming");
};

// retrieve "/comedians/latest" doc
const getLatestComediansData = async () => {
  return getFirebaseDoc("comedians", "latest");
};

//
// user favorites handling
//

exports.toggleUserFavorite = functions.https.onCall(async (data, context) => {
  const userId = context.auth.uid;
  const favoriteId = data.favoriteId;
  const [newFavoriteCategory, newFavoriteId] = favoriteId.split("-");

  const userDocRef = db.collection("users").doc(userId);
  const userDocResponse = await userDocRef.get();
  const userDocData = userDocResponse.data();
  const userDocFavoritesArr = userDocData.favorites;

  // depending on the arguments: /comedians/all or /specials/all
  const allContentDocRef = db.collection(newFavoriteCategory).doc("all");

  if (userDocFavoritesArr.includes(favoriteId)) {
    // remove favorite from /users/.../favorites: []
    userDocRef.set(
      { favorites: FieldValue.arrayRemove(favoriteId) },
      { merge: true }
    );
    // update favorite count: /.../all/id: {favorites: # }
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(-1),
        },
      },
      { merge: true }
    );
    // TODO: Remove favorite count from topFavorites if present
    // ! on removal of a favorite, /category/all is NOT checked for a new potential top favorite
  } else {
    // add favorite from /users/.../favorites: []
    userDocRef.set(
      { favorites: FieldValue.arrayUnion(favoriteId) },
      { merge: true }
    );
    // update favorite count: /.../all/id: {favorites: # }
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(1),
        },
      },
      { merge: true }
    );
  }
  //
  // top favorites
  //

  const topFavoritesLimit = 3;

  // TODO might need to move topFavorites functionality to a function that runs on an interval to prevent excessive calls

  // after updating the favorite count for the content, retrieve it's new favorite count & data
  const contentDocResponse = await allContentDocRef.get();
  const contentDocData = await contentDocResponse.data();
  const updatedContentData = contentDocData[newFavoriteId];
  const updatedFavoriteCount = updatedContentData["favorites"];

  // remove timestamp values from data passed in from function call (comedians only)
  // --- dateAdded: { nanoseconds, seconds }
  let newFavoriteData = data.data;
  if ("dateAdded" in newFavoriteData) delete newFavoriteData["dateAdded"];

  getTopFavoritesForCategory(newFavoriteCategory)
    .then((data) => {
      let topFavorites = data;
      const numberOfTopFavorites = Object.keys(topFavorites).length;

      // if the top favorite limit of 10 hasn't been reached yet, add the new favorite
      if (numberOfTopFavorites < topFavoritesLimit) {
        db.collection(newFavoriteCategory)
          .doc("topFavorites")
          .set({ ...topFavorites, [newFavoriteId]: { ...updatedContentData } });
        return;
      }

      console.log(
        "top favorite limit reached: determine if new fav in the top favorite counts"
      );

      const leastFavoriteOfTopTen = Object.keys(topFavorites).reduce(
        (leastFav, current) => {
          const currentCount = topFavorites[current].favorites;
          const currentId = topFavorites[current].id;
          if (leastFav === null) return { id: currentId, count: currentCount };

          return leastFav.count > currentCount
            ? {
                id: currentId,
                count: currentCount,
              }
            : { id: leastFav.id, count: leastFav.count };
        },
        null
      );

      // if not a new topFavorite, quit here
      // note: if equal to the least favorite, newer content is preferred
      if (updatedFavoriteCount < leastFavoriteOfTopTen.count) {
        console.log("NOT a new top favorite");
        return;
      }

      console.log("IS A NEW TOP favorite entry!");

      // new favorite is in the top ten & topFavorite count >= topFavoriteLimit
      // out with the old:
      delete topFavorites[leastFavoriteOfTopTen.id];

      // in with the new:
      topFavorites = {
        ...topFavorites,
        [newFavoriteId]: { ...updatedContentData },
      };

      // update the top ten
      db.collection(newFavoriteCategory).doc("topFavorites").set(topFavorites);
    })
    .catch((error) => {
      console.log(error);
      // topFavorites doesn't exist in the db
      db.collection(newFavoriteCategory)
        .doc("topFavorites")
        .set({ [newFavoriteId]: { ...newFavoriteData, favorites: 1 } });
    });
});

const getTopFavoritesForCategory = async (category) => {
  return getFirebaseDoc(category, "topFavorites");
};

//
// add comedian & their specials to the db.
//

exports.addComedianAndSpecials = functions.https.onCall(
  async (data, context) => {
    const { id } = data;
    if (!id) return;

    const comedianUrl = getPersonDetailsURL(id);
    const specialsUrl = getAllSpecialsForPersonURL(id);
    const comedianData = await fetchData(comedianUrl);
    const { results: specialsData } = await fetchData(specialsUrl);

    if (
      !comedianData.id ||
      comedianData.success === false ||
      specialsData.success === false
    ) {
      throw new functions.https.HttpsError(
        "Fail",
        "Unable to add the comedian at this time."
      );
    }

    const comedian = {
      [comedianData.id]: {
        name: comedianData.name,
        id: comedianData.id,
        profile_path: comedianData.profile_path,
        dateAdded: FieldValue.serverTimestamp(),
        favorites: 0,
      },
    };

    const specials = specialsData.reduce((prev, special) => {
      return {
        ...prev,
        [special.id]: {
          id: special.id,
          title: special.title,
          poster_path: special.poster_path,
          backdrop_path: special.backdrop_path,
          release_date: special.release_date,
          comedian: comedianData.name,
          comedianId: comedianData.id,
          favorites: 0,
        },
      };
    }, {});

    // fetch latest & upcoming data & return {} if error is thrown
    let latestComedians = await getLatestComediansData().catch(() => {
      return {};
    });
    let latestSpecials = await getLatestSpecialsData().catch(() => {
      return {};
    });
    let upcomingSpecials = await getUpcomingSpecialsData().catch(() => {
      return {};
    });

    // add comedian to db: "/comedians/latest" & "/comedians/all"
    // check release date of the specials to be added to the db:
    // - if not released yet, add to /specials/upcoming
    // - if newer than one of the latest 10, add to /specials/latest

    for (const specialId in specials) {
      const specialData = specials[specialId];
      const isNotReleasedYet = isSpecialNotOutYet(specialData);

      if (isNotReleasedYet) {
        upcomingSpecials = {
          ...upcomingSpecials,
          [specialId]: specialData,
        };
      } else {
        const isALatestRelease = isSpecialALatestRelease(
          specialData,
          latestSpecials
        );

        if (isALatestRelease) {
          latestSpecials = {
            ...latestSpecials,
            [specialId]: specialData,
          };
        }
      }
    }

    latestComedians = { ...latestComedians, ...comedian };

    // finally, reduce latest specials & comedians to a final quantity
    const latestTenSpecials = reduceLatestCountToNum(
      latestSpecials,
      10,
      "release_date"
    );

    const latestTenComedians = reduceLatestCountToNum(
      latestComedians,
      10,
      "dateAdded"
    );

    // update the db
    return db
      .collection("comedians")
      .doc("all")
      .set(comedian, { merge: true })
      .then(() => {
        console.log(`- Added ${comedianData.name} to /comedians/all`);
        admin
          .firestore()
          .collection("comedians")
          .doc("latest")
          .set(latestTenComedians);
      })
      .then(() => {
        console.log(`- Added ${comedianData.name} to /comedians/latest`);
        db.collection("specials").doc("all").set(specials, { merge: true });
      })
      .then(() => {
        console.log(`- Added ${comedianData.name}'s specials to /specials/all`);
        db.collection("specials").doc("latest").set(latestTenSpecials);
      })
      .then(() => {
        console.log(
          `- Added ${comedianData.name}'s specials to /specials/upcoming`
        );
        db.collection("specials").doc("upcoming").set(upcomingSpecials);
      })
      .then(() => {
        console.log(
          `Added ${comedianData.name}'s specials to /specials/upcoming`
        );
        console.log(`Successfully added ${comedianData.name}`);
        return {
          added: true,
        };
      })
      .catch((error) => {
        console.log(error);
        throw new functions.https.HttpsError("Firebase Cloud Function Error", {
          ...error,
        });
      });
  }
);

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
  if (!latestSpecialsObj || Object.keys(latestSpecialsObj).length === 0)
    return true;

  for (const existingSpecial in latestSpecialsObj) {
    const existingDate = parseISO(
      latestSpecialsObj[existingSpecial].release_date
    );
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
