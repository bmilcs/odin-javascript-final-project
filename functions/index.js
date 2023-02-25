const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { parseISO, isAfter } = require("date-fns");

admin.initializeApp();

const API_KEY = functions.config().tmdb.key;

// /users/
//   {id}/
//     email
//     name
//     id
//     favorites

// /comedians/
//   all/
//     "id": {
//       name:      "Tom Segura",
//       id:        123456,
//       imageId:   "09ujoidahfi2h3f0hadf.jpg",
//       dateAdded: timestamp,
//       favorites: 5
//     }
//   new/
//     "id": {
//       name:      "Tom Segura",
//       id:        123456,
//       imageId:   "09ujoidahfi2h3f0hadf.jpg",
//       dateAdded: timestamp,
//     }

// /specials/
//   all/
//     "id": {
//       title:      "Ball Hog",
//       id:         123456,
//       imageId:    "09ujoidahfi2h3f0hadf.jpg",
//       comedian:   "Tom Segura",
//       comedianId: 2093409234
//       favorites:  5
//     }
//   new/
//     "id": {
//       title:     "Ball Hog",
//       id:        123456,
//       releaseDate: "1/1/25",
//       imageId:   "09ujoidahfi2h3f0hadf.jpg",
//       comedian:  "Tom Segura",
//     }
//   upcoming/
//     "id": {
//       title:     "Ball Hog",
//       id:        123456,
//       releaseDate: "1/1/25",
//       imageId:   "09ujoidahfi2h3f0hadf.jpg",
//       comedian:  "Tom Segura",
//     }

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
      return data;
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

//
// add comedian & their specials
//

// clients push a tmdb id to /comedians/toAdd when requesting a
// new comedian be added to the db
exports.addComedianAndSpecials = functions.firestore
  .document("/comedians/toAdd")
  .onCreate(async (change, context) => {
    const toAddData = change.data();

    const { personalId } = toAddData;
    if (!personalId) return;

    const comedianUrl = getPersonDetailsURL(personalId);
    const specialsUrl = getAllSpecialsForPersonURL(personalId);

    const comedianData = await fetchData(comedianUrl);
    const { results: specialsData } = await fetchData(specialsUrl);

    const comedian = {
      [comedianData.id]: {
        name: comedianData.name,
        id: comedianData.id,
        imageId: comedianData.profile_path,
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
          imageId: special.poster_path,
          releaseDate: special.release_date,
          comedian: comedianData.name,
          comedianId: comedianData.id,
        },
      };
    }, {});

    // check release date of the specials to be added to the db:
    // - if not released yet, add to /specials/upcoming
    // - if newer than one of the latest 10, add to /specials/latest

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

    // finally, reduce latest specials to a final quantity
    const latestTenSpecials = reduceLatestSpecialsCountToNum(
      latestSpecials,
      10
    );

    // update the db
    admin
      .firestore()
      .collection("comedians")
      .doc("all")
      .set(comedian, { merge: true });
    admin
      .firestore()
      .collection("specials")
      .doc("all")
      .set(specials, { merge: true });
    admin
      .firestore()
      .collection("specials")
      .doc("latest")
      .set(latestTenSpecials);
    admin
      .firestore()
      .collection("specials")
      .doc("upcoming")
      .set(upcomingSpecials);

    admin.firestore().collection("comedians").doc("toAdd").delete(toAddData);
  });

const isSpecialNotOutYet = (special) => {
  const specialDate = parseISO(special.releaseDate);
  const today = new Date();
  return isAfter(specialDate, today) ? true : false;
};

const isSpecialALatestRelease = (special, latestSpecialsObj) => {
  const specialDate = parseISO(special.releaseDate);

  for (const existingSpecial in latestSpecialsObj) {
    const existingDate = parseISO(
      latestSpecialsObj[existingSpecial].releaseDate
    );
    const isMoreRecent = isAfter(specialDate, existingDate);

    if (isMoreRecent) {
      isALatestSpecial = true;
      return true;
    }
  }

  return false;
};

const reduceLatestSpecialsCountToNum = (specialsObj, num) => {
  const array = [];

  for (const special in specialsObj) {
    array.push(specialsObj[special]);
  }

  return array
    .sort((a, b) => {
      const aDate = parseISO(a.releaseDate);
      const bDate = parseISO(b.releaseDate);
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
