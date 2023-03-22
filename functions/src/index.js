const nodemailer = require('nodemailer');
const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { parseISO, isAfter } = require('date-fns');

initializeApp();
const db = getFirestore();

const API_KEY = functions.config().tmdb.key;
const GMAIL_EMAIL = functions.config().gmail.email;
const GMAIL_PASSWORD = functions.config().gmail.password;
const MAINTENANCE_SCHEDULE = 'every 12 hours';

// maintenance

exports.updateDbAndIssueNotifications = functions.pubsub
  .schedule(MAINTENANCE_SCHEDULE)
  .onRun(async () => {
    try {
      const allNewSpecials = await getAllNewSpecialsAndUpdateDB();
      await issueAllNotifications(allNewSpecials);
      console.log('--> Update complete!');
    } catch (e) {
      console.log(e);
    }
    return null;
  });

exports.updateTopFavorites = functions.pubsub.schedule(MAINTENANCE_SCHEDULE).onRun(async () => {
  await updateTopFavorites();
  return null;
});

const getAllNewSpecialsAndUpdateDB = async () => {
  const allComediansDocData = await getFirebaseDoc('comedians', 'all');
  const allSpecialsDocData = await getFirebaseDoc('specials', 'all');
  const allComedianIds = Object.keys(allComediansDocData);
  const allExistingSpecialIds = Object.keys(allSpecialsDocData);
  const allNewSpecials = [];

  // promises allow us to execute all db updates before issuing notifications
  const updateDbWithNewSpecials = allComedianIds.reduce(async (accumulatorPromise, comedianId) => {
    return accumulatorPromise.then(() => {
      return updateDbWithAComediansNewSpecials(comedianId, allExistingSpecialIds).then(
        (newSpecials) => {
          if (!newSpecials) return;
          newSpecials.forEach((newSpecial) => allNewSpecials.push(newSpecial));
        },
      );
    });
  }, Promise.resolve());

  console.log('--> Starting DB Update...');
  return await updateDbWithNewSpecials.then(() => {
    console.log('--> Successfully updated DB');
    return allNewSpecials;
  });
};

// resolves with null if no new specials are present OR an array
// of { comedianData, specialData } for each new special found
const updateDbWithAComediansNewSpecials = (comedianId, allExistingSpecialIds) => {
  return new Promise(async (resolve, reject) => {
    const fetchedSpecialsRawData = await fetchTmdbSpecialsData(comedianId);

    const missingSpecialsRawData = fetchedSpecialsRawData.filter((fetchedSpecial) => {
      return !allExistingSpecialIds.some(
        (existingSpecialId) => Number(fetchedSpecial.id) === Number(existingSpecialId),
      );
    });

    const hasNewSpecials = missingSpecialsRawData.length > 0;
    if (!hasNewSpecials) return resolve(null);

    try {
      // get fresh data for the comedian's page
      const comedianRawData = await fetchTmdbComedianData(comedianId);

      // add only new specials to /specials/all
      // this prevents overwriting existing special favorite counts (set to 0 when added)
      await addSpecialsToAllSpecialsDoc(missingSpecialsRawData);

      // add only new specials to .../upcoming and .../latest if applicable
      // existing specials in the db have already been checked
      await addSpecialsToLatestOrUpcomingSpecialsDocs(missingSpecialsRawData);

      // update /comedianPages/{comedianId}/
      await addComedianPageDoc(comedianRawData, fetchedSpecialsRawData);

      // update all /specialPages/ related to comedian, adding a link to this new special
      await addSpecialsPageDocs(comedianRawData, fetchedSpecialsRawData);

      console.log(
        `--> New Special Added! ${comedianRawData.name} (qty: ${missingSpecialsRawData.length})`,
      );

      // used to issue notifications from the parent function call
      const addedSpecials = missingSpecialsRawData.map((special) => {
        return { specialRawData: special, comedianRawData };
      });

      return resolve(addedSpecials);
    } catch (e) {
      console.log(`--> ERROR: ${comedianRawData.name}'s new specials NOT updated.`);
      return reject(e);
    }
  });
};

// notifications are created after new specials are found during updates
// - stored in: /users/{uid}/notifications: []

const issueAllNotifications = async (allNewSpecials) => {
  await allNewSpecials.forEach(async ({ comedianRawData, specialRawData }) => {
    const comedianId = comedianRawData.id;

    const comedianSubscribersDocRef = db
      .collection('comedianSubscribers')
      .doc(comedianId.toString());

    const comedianSubscribersDocResponse = await comedianSubscribersDocRef.get();
    const hasHadASubscriber = comedianSubscribersDocResponse.exists;
    if (!hasHadASubscriber) return;

    const comedianSubscribersData = await comedianSubscribersDocResponse.data();
    const hasActiveSubscribers = comedianSubscribersData.length > 0;
    if (!hasActiveSubscribers) return;

    const subscriberEmailBccList = Object.keys(comedianSubscribersData).reduce((prev, id) => {
      return `${prev}${comedianSubscribersData[id].email},`;
    }, '');

    try {
      await sendEmailNotifications(subscriberEmailBccList, specialRawData, comedianRawData);
    } catch (e) {
      console.log(`--> ERROR: Email notification fail: ${e}`);
    }

    const allSubscriberUserIds = Object.keys(comedianSubscribersData);

    for await (const userId of allSubscriberUserIds) {
      try {
        await createFrontendNotifications(userId, comedianRawData, specialRawData);
      } catch (e) {
        console.error(`--> ERROR: Unable to create front end notification for ${userId}\n${e}`);
      }
    }
  });

  console.log('--> Successfully issued notifications');
  return;
};

const createFrontendNotifications = async (userId, comedianRawData, specialRawData) => {
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

const sendEmailNotifications = async (subscriberEmailBccList, specialRawData, comedianRawData) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_EMAIL, pass: GMAIL_PASSWORD },
  });

  const message = {
    from: GMAIL_EMAIL,
    bcc: subscriberEmailBccList,
    subject: `${comedianRawData.name} released a new comedy special!`,
    html: `<a href="https://comedy.bmilcs.com/specials/${specialRawData.id}"><h1>${
      specialRawData.title
    }</h1></a><img alt=${specialRawData.title} src=${getTMDBImageURL(
      specialRawData.poster_path,
    )} />`,
  };

  return await transporter.sendMail(message);
};

// notifications are deleted when a user clicks on the notification dropdown link

exports.deleteUserNotification = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    // appcheck w/ recaptchav3
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This function must be called from an App Check verified app.',
      );
    }

    const userId = context.auth.uid;
    const specialId = data.id;

    try {
      const userData = await getFirebaseDoc('users', userId);
      const userNotifications = userData.notifications;

      const updatedUserNotifications = userNotifications.filter(
        (notification) => notification.data.id !== specialId,
      );

      return await db.collection('users').doc(userId).update({
        notifications: updatedUserNotifications,
      });
    } catch (e) {
      console.log('Unable to remove user notification');
      throw new functions.https.HttpsError('failed-frontend-notification', e);
    }
  });

// add a new comedian & their specials to the db: triggered by client (search results page)

exports.addComedianAndSpecials = functions
  .runWith({
    enforceAppCheck: true,
  })
  .https.onCall(async (data, context) => {
    // app check w/ recaptcha v3
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This function must be called from an App Check verified app.',
      );
    }

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
      .then(() => addSpecialsToLatestOrUpcomingSpecialsDocs(specialsRawData))
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

// firestore: /comedianPages/{comedianId}/

const addComedianPageDoc = (comedianRawData, specialsRawData) => {
  const comedian = {
    name: comedianRawData.name,
    id: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
    biography: comedianRawData.biography,
    birthday: comedianRawData.birthday,
    imdb_id: comedianRawData.imdb_id,
  };

  // content is categorized by "special" and "appearance"
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

// firestore: /specialPages/{id}

const addSpecialsPageDocs = async (comedianRawData, specialsRawData) => {
  const comedian = {
    comedian: comedianRawData.name,
    comedianId: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
  };

  const specials = specialsRawData.reduce((prev, special, index) => {
    // each special page features the details of the targeted special
    // and provides links to the comedian & other content by the same comedian

    const otherContentByComedian = specialsRawData
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
        otherContent: otherContentByComedian,
      },
    };
  }, {});

  const batch = db.batch();
  for (const special in specials) {
    const pageData = {
      comedian,
      ...specials[special],
    };
    const docRef = db.collection('specialPages').doc(special);
    batch.set(docRef, pageData);
  }

  return await batch.commit();
};

// firestore: /comedians/all

const addComedianToAllComediansDoc = async (comedianRawData) => {
  const comedian = {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
      favorites: 0,
    },
  };

  return await db.collection('comedians').doc('all').set(comedian, { merge: true });
};

// firestore: /specials/all

const addSpecialsToAllSpecialsDoc = async (specialsRawData) => {
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

  return await db.collection('specials').doc('all').set(specials, { merge: true });
};

// firestore: /comedians/latest

const addComedianToLatestComediansDoc = async (comedianRawData) => {
  const comedian = {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
      dateAdded: FieldValue.serverTimestamp(),
    },
  };

  // if no latest comedians exist, return empty obj
  let latestComedians = await getLatestComediansData().catch(() => {
    return {};
  });

  latestComedians = { ...latestComedians, ...comedian };

  const latestTenComedians = reduceLatestCountToNum(latestComedians, 10, 'dateAdded');

  return await db.collection('comedians').doc('latest').set(latestTenComedians);
};

// firestore: /specials/latest & /specials/upcoming

const addSpecialsToLatestOrUpcomingSpecialsDocs = async (specialsRawData) => {
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

  return await db
    .collection('specials')
    .doc('latest')
    .set(latestTenSpecials)
    .then(() => db.collection('specials').doc('upcoming').set(upcoming));
};

// user favorite toggling
// - updates personal favorites: /users/{userId}/favorites: [] array
// - updates content favorite count: /comedians/all/{comedianId} (or /specials/all): favorites: +/-1;

exports.toggleUserFavorite = functions
  .runWith({
    enforceAppCheck: true,
  })
  .https.onCall(async (data, context) => {
    // app check w/ recaptcha v3
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This function must be called from an App Check verified app.',
      );
    }

    // testGetAllNewSpecialsAndUpdateDb();
    // return;

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    const userDocRef = db.collection('users').doc(userId);

    // favoriteId: "category-tmdbId" (ie: "comedians-123456789", "specials-123456789")
    const favoriteId = data.favoriteId;
    const [category, tmdbId] = favoriteId.split('-');

    try {
      const userDocResponse = await userDocRef.get();
      const userDocData = userDocResponse.data();
      const userDocFavoritesArr = userDocData.favorites;

      // /comedians/all or /specials/all
      const contentAllDocRef = db.collection(category).doc('all');

      if (userDocFavoritesArr.includes(favoriteId)) {
        // remove favorite from /users/.../favorites: []
        userDocRef.set({ favorites: FieldValue.arrayRemove(favoriteId) }, { merge: true });
        // update content's favorite count: /{comedians/specials}/all/id: {favorites: # }
        await contentAllDocRef.set(
          {
            [tmdbId]: {
              favorites: FieldValue.increment(-1),
            },
          },
          { merge: true },
        );

        if (category === 'comedians') await unsubscribeUserToComedian(userId, userEmail, tmdbId);
      } else {
        // add favorite from /users/.../favorites: []
        userDocRef.set({ favorites: FieldValue.arrayUnion(favoriteId) }, { merge: true });
        // update content's favorite count: /{comedians/specials}/all/id: {favorites: # }
        await contentAllDocRef.set(
          {
            [tmdbId]: {
              favorites: FieldValue.increment(1),
            },
          },
          { merge: true },
        );
        if (category === 'comedians') await subscribeUserToComedian(userId, userEmail, tmdbId);
      }
    } catch (e) {
      throw new functions.https.HttpsError(
        'failed-favorite-toggle',
        'User favorite toggle failed.',
      );
    }

    return {
      status: 'complete',
    };
  });

const subscribeUserToComedian = async (userId, userEmail, comedianId) => {
  // console.log(`Subscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  return comedianSubscribersDocRef.set(
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
  // console.log(`Unsubscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  return comedianSubscribersDocRef.update({
    [userId]: FieldValue.delete(),
  });
};

// update top favorite comedians & specials on a schedule

const updateTopFavorites = async () => {
  const topComediansLimit = 10;
  const topSpecialsLimit = 10;

  const comediansAllDocData = await getFirebaseDoc('comedians', 'all');
  const specialsAllDocData = await getFirebaseDoc('specials', 'all');

  const updatedTopComediansData = getNewTopFavorites(comediansAllDocData, topComediansLimit);
  const updatedTopSpecialsData = getNewTopFavorites(specialsAllDocData, topSpecialsLimit);

  return db
    .collection('comedians')
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
};

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

// given a object of comedians or specials, sort by "dateField" & limit the results to "num"

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

// db retrieval functions

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

// tmdb-related functions

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

const getTMDBImageURL = (path) => {
  return `https://image.tmdb.org/t/p/original/${path}`;
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

// tests

// this test deletes random specials from the database & runs an update.
// it checks that the deleted specials are found & added back to the db
const testGetAllNewSpecialsAndUpdateDb = async () => {
  console.log('--> TEST START');

  const allSpecialsInDb = await getFirebaseDoc('specials', 'all');
  const allSpecialIdsInDb = Object.keys(allSpecialsInDb);
  const randomSpecialsToDelete = [];

  // delete 3 random specials from the db
  for (let x = 0; x < 3; x++) {
    const randomIndex = getRandomInt(allSpecialIdsInDb.length);
    const specialId = allSpecialIdsInDb[randomIndex];
    const specialTitle = allSpecialsInDb[specialId].title;
    randomSpecialsToDelete.push({ id: specialId, title: specialTitle });
  }

  await db
    .collection('specials')
    .doc('all')
    .update({
      [randomSpecialsToDelete[0].id]: FieldValue.delete(),
      [randomSpecialsToDelete[1].id]: FieldValue.delete(),
      [randomSpecialsToDelete[2].id]: FieldValue.delete(),
    })
    .then(() =>
      randomSpecialsToDelete.forEach((special) =>
        console.log(`Deleted from DB: "${special.title}"`),
      ),
    );

  // run update
  const updatedSpecials = await getAllNewSpecialsAndUpdateDB();

  // make sure updates returned from fn call match those deleted from the db above
  const returnResults = updatedSpecials.map((update) => {
    const specialTitle = update.specialRawData.title;
    const deletedSpecialWasReturned = randomSpecialsToDelete.some(
      (deletedSpecial) => deletedSpecial.title === update.specialRawData.title,
    );
    return deletedSpecialWasReturned
      ? `SUCCESS: Returned from update function call "${specialTitle}"`
      : `ERROR: Not returned from update function call "${specialTitle}"`;
  });

  // make sure the specials were re-added to the db
  const allSpecialsInDbPostUpdate = await getFirebaseDoc('specials', 'all');
  const allSpecialIdsInDbPostUpdate = Object.keys(allSpecialsInDbPostUpdate);

  const specialsReAddedToDbResults = updatedSpecials.map((update) => {
    const specialId = update.specialRawData.id;
    const specialTitle = update.specialRawData.title;

    return allSpecialIdsInDbPostUpdate.includes(specialId.toString())
      ? `SUCCESS: Added back to Db: "${specialTitle}"`
      : `ERROR: Missing from Db: "${specialTitle}"`;
  });

  [...returnResults, ...specialsReAddedToDbResults].forEach((update) => console.log(`${update}`));
  console.log('--> TEST COMPLETE');
};

const getRandomInt = (maxVal) => Math.floor(Math.random() * (maxVal - 0) + 0);
