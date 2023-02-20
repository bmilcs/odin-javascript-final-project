const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

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
// add comedian & their specials
//

exports.addComedianAndSpecials = functions.firestore
  .document("/comedians/toAdd")
  .onUpdate(async (change, context) => {
    // const original = change.before.data();
    const data = change.after.data();
    const { personalId } = data;
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
    admin.firestore().collection("comedians").doc("toAdd").delete(data);
  });

//
//
//

//
// tmdb functions
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
