const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const tmdbApi = functions.config().tmdb.key;

exports.addComedianAndSpecials = functions.firestore
  .document("/comedians/toAdd")
  .onUpdate((change, context) => {
    // const original = change.before.data();
    const { personalId } = change.after.data();
    // if (tmdbApiKey) console.log("Yay key imported");
    console.log(tmdbApi);
    console.log("Firestore function triggered");
  });
