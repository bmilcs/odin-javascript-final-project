const tmdb = require("./tmdb.ts");
const fb = require("./firebase.ts");

fb.admin.initializeApp();

exports.addComedianAndSpecials = fb.functions.firestore
  .document("/comedians/toAdd")
  .onUpdate(async (change, context) => {
    // const original = change.before.data();
    const data = change.after.data();
    const { personalId } = data;
    if (!personalId) return;

    const comedianUrl = tmdb.getPersonDetailsURL(personalId);
    const specialsUrl = tmdb.getAllSpecialsForPersonURL(personalId);

    const comedianData = await tmdb.fetchData(comedianUrl);
    const { results: specialsData } = await tmdb.fetchData(specialsUrl);

    const comedian = {
      [comedianData.id]: {
        name: comedianData.name,
        id: comedianData.id,
        imageId: comedianData.profile_path,
        dateAdded: fb.FieldValue.serverTimestamp(),
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

    fb.admin
      .firestore()
      .collection("comedians")
      .doc("all")
      .set(comedian, { merge: true });
    fb.admin
      .firestore()
      .collection("specials")
      .doc("all")
      .set(specials, { merge: true });
    fb.admin.firestore().collection("comedians").doc("toAdd").delete(data);
  });
