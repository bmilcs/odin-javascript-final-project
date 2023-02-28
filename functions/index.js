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
    .then((doc) => {
      if (!(doc && doc.exists)) throw Error("Error");
      return doc.data();
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
  const userDocFavoritesField = userDocData.favorites;

  // /comedians/all or /specials/all
  const allContentDocRef = db.collection(newFavoriteCategory).doc("all");

  if (userDocFavoritesField.includes(favoriteId)) {
    // remove a favorite
    userDocRef.set(
      { favorites: FieldValue.arrayRemove(favoriteId) },
      { merge: true }
    );
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(-1),
        },
      },
      { merge: true }
    );
  } else {
    // add a favorite
    userDocRef.set(
      { favorites: FieldValue.arrayUnion(favoriteId) },
      { merge: true }
    );
    allContentDocRef.set(
      {
        [newFavoriteId]: {
          favorites: FieldValue.increment(1),
        },
      },
      { merge: true }
    );
  }

  const contentDocResponse = await allContentDocRef.get();
  const contentDocData = await contentDocResponse.data();
  const contentFavoriteCount = contentDocData[newFavoriteId]["favorites"];

  // remove dateAdded server timestamp
  let newFavoriteContentData = data.data;
  if ("dateAdded" in newFavoriteContentData)
    delete newFavoriteContentData["dateAdded"];

  getTopFavoritesForCategory(newFavoriteCategory)
    .then((data) => {
      const leastFavoriteTopTenFavoriteCount = Object.keys(data).reduce(
        (lowest, current) => {
          if (lowest === null) return data[current].favorites;
          return lowest > data[current].favorites ? data[current] : lowest;
        },
        null
      );

      // TODO: compare favorite counts --- if greater than lowest, add it to top ten & remove the least favorite

      db.collection(newFavoriteCategory)
        .doc("topFavorites")
        .set(
          {
            [newFavoriteId]: { ...newFavoriteContentData },
          },
          { merge: true }
        );
    })
    .catch((error) => {
      console.log("---> ERROR", error);
      // topFavorites doesn't exist in the db
      db.collection(newFavoriteCategory)
        .doc("topFavorites")
        .set({ [newFavoriteId]: { ...newFavoriteContentData } });
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
