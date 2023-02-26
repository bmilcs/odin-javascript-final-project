const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { parseISO, isAfter } = require("date-fns");

admin.initializeApp();

const API_KEY = functions.config().tmdb.key;

//
// db retrieval functions
//

const getFirebaseDoc = async (collection, doc) => {
  return admin
    .firestore()
    .collection(collection)
    .doc(doc)
    .get()
    .then((doc) => {
      if (!(doc && doc.exists)) return;
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

// add comedian & their specials to the db.
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
        },
      };
    }, {});

    // add comedian to db: "/comedians/latest" & "/comedians/all"
    // check release date of the specials to be added to the db:
    // - if not released yet, add to /specials/upcoming
    // - if newer than one of the latest 10, add to /specials/latest

    let latestComedians = await getLatestComediansData();
    let latestSpecials = await getLatestSpecialsData();
    let upcomingSpecials = await getUpcomingSpecialsData();

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
    return admin
      .firestore()
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
        admin
          .firestore()
          .collection("specials")
          .doc("all")
          .set(specials, { merge: true });
      })
      .then(() => {
        console.log(`- Added ${comedianData.name}'s specials to /specials/all`);
        admin
          .firestore()
          .collection("specials")
          .doc("latest")
          .set(latestTenSpecials);
      })
      .then(() => {
        console.log(
          `- Added ${comedianData.name}'s specials to /specials/upcoming`
        );
        admin
          .firestore()
          .collection("specials")
          .doc("upcoming")
          .set(upcomingSpecials);
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
