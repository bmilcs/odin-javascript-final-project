import { FirebaseError } from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-admin/firestore';
import { CallableContext } from 'firebase-functions/v1/https';

// fixes "Cannot redeclare block scoped variable" error across modules
export {};

const functions = require('firebase-functions');
exports.functions = functions;

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const { fetchTmdbComedianData, fetchTmdbSpecialsData, getTMDBImageURL } = require('./api/tmdb.js');
const {
  isSpecialNotReleasedYet,
  isSpecialReleasedToday,
  parseISO,
  isAfter,
  getReleaseDateType,
  formatDate,
  getTodayObj,
  addDays,
} = require('./utils/dates.js');
const {
  processComedianPage,
  processSpecialPages,
  processAllComediansField,
  processAllSpecialsFields,
  processUserNotification,
  processLatestComediansField,
  processLatestUpcomingSpecialsField,
} = require('./data/processData.js');

initializeApp();
const db = getFirestore();

const GMAIL_EMAIL = functions.config().gmail.email;
const GMAIL_PASSWORD = functions.config().gmail.password;

const MAINTENANCE_SCHEDULE = 'every 12 hours';
const TEST_MODE = false;

const TOP_COMEDIANS_LIMIT = 10;
const TOP_SPECIALS_LIMIT = 10;
const LATEST_COMEDIANS_LIMIT = 5;
const LATEST_SPECIALS_LIMIT = 10;

// maintenance

exports.updateDbAndIssueNotifications = functions.pubsub
  .schedule(MAINTENANCE_SCHEDULE)
  .onRun(async () => {
    try {
      const allNewSpecials = await getAllNewSpecialsAndUpdateDB();
      await issueAllNotifications(allNewSpecials);
    } catch (e) {
      console.log(`--> ERROR: Updating Specials & Issuing Notifications FAILED!`);
      console.log(e);
    }
    return null;
  });

exports.updateTopFavorites = functions.pubsub.schedule(MAINTENANCE_SCHEDULE).onRun(async () => {
  try {
    await updateTopFavorites();
  } catch (e) {
    console.log(`--> ERROR: Top Favorites update FAILED!`);
    console.log(e);
  }
  return null;
});

exports.processUpcomingSpecials = functions.pubsub.schedule('15 0 * * *').onRun(async () => {
  try {
    const specialsReleasedToday = await getTodaysReleasesAndMoveToLatestDoc();
    console.log(specialsReleasedToday);
    console.log('Test not implemented! Fix!');
    // await issueNotificationsForTodaysReleases(specialsReleasedToday);
  } catch (e) {
    console.log(`--> ERROR: Top Favorites update FAILED!`);
    console.log(e);
  }
  return null;
});

// add a new comedian & their specials to the db: triggered by client (search results page)

interface IDataContentId {
  id: string;
}

exports.addComedianAndSpecials = functions
  .runWith({
    enforceAppCheck: true,
  })
  .https.onCall(async (data: IDataContentId, context: CallableContext) => {
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
        'fetch-comedian-data-failed',
        `Unable to add the comedian at this time. Something went wrong when fetching TMDB data for Person ID #${id}`,
      );
    }

    return addComedianPageDoc(comedianRawData, specialsRawData)
      .then(() => addSpecialsPageDocs(comedianRawData, specialsRawData))
      .then(() => addComedianToAllComediansDoc(comedianRawData))
      .then(() => addComedianToLatestComediansDoc(comedianRawData))
      .then(() => addSpecialsToAllSpecialsDoc(specialsRawData))
      .then(() => addSpecialsToLatestOrUpcomingSpecialsDocs(comedianRawData, specialsRawData))
      .catch((error: FirebaseError) => {
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

const addComedianPageDoc = (comedianRawData: IRawComedian, specialsRawData: IRawSpecial[]) => {
  const pageData = processComedianPage(comedianRawData, specialsRawData);
  const comedianId = comedianRawData.id.toString();
  return db.collection('comedianPages').doc(comedianId).set(pageData);
};

// firestore: /specialPages/{id}

const addSpecialsPageDocs = async (
  comedianRawData: IRawComedian,
  specialsRawData: IRawSpecial[],
) => {
  const specialPagesData = processSpecialPages(comedianRawData, specialsRawData);
  const batch = db.batch();
  specialPagesData.forEach((specialPage: ISpecialPage) => {
    const docRef = db.collection('specialPages').doc(specialPage.special.id.toString());
    batch.set(docRef, specialPage);
  });
  return await batch.commit();
};

// firestore: /comedians/all

const addComedianToAllComediansDoc = (comedianRawData: IRawComedian) => {
  const comedian = processAllComediansField(comedianRawData);
  return db.collection('comedians').doc('all').set(comedian, { merge: true });
};

// firestore: /specials/all

const addSpecialsToAllSpecialsDoc = async (specialsRawData: IRawSpecial[]) => {
  const specials = processAllSpecialsFields(specialsRawData);
  return await db.collection('specials').doc('all').set(specials, { merge: true });
};

// firestore: /comedians/latest

const addComedianToLatestComediansDoc = async (comedianRawData: IRawComedian) => {
  const date = FieldValue.serverTimestamp();
  const comedian = processLatestComediansField(comedianRawData, date);
  const latestComedians = await getLatestComediansData().catch(() => {
    return {};
  });
  const newLatestComedians = { ...latestComedians, ...comedian };
  const latestTenComedians = reduceLatestComediansCount(newLatestComedians, LATEST_COMEDIANS_LIMIT);
  return await db.collection('comedians').doc('latest').set(latestTenComedians);
};

const reduceLatestComediansCount = (comedians: ILatestComedians, num: number) => {
  const array = [];
  for (const data in comedians) {
    array.push(comedians[data]);
  }
  return array
    .sort((a, b) => {
      const aDate = parseISO(a.dateAdded);
      const bDate = parseISO(b.dateAdded);
      return isAfter(aDate, bDate) ? -1 : 1;
    })
    .splice(0, num)
    .reduce((prev, curr) => {
      return { ...prev, [curr.id]: { ...curr } };
    }, {});
};

// firestore: /specials/latest & /specials/upcoming

const addSpecialsToLatestOrUpcomingSpecialsDocs = async (
  comedianRawData: IRawComedian,
  specialsRawData: IRawSpecial[],
) => {
  let latest = await getLatestSpecialsData().catch(() => {
    return {};
  });
  let upcoming = await getUpcomingSpecialsData().catch(() => {
    return {};
  });

  specialsRawData.forEach((special: IRawSpecial) => {
    if (isSpecialNotReleasedYet(special)) {
      upcoming = {
        ...upcoming,
        ...processLatestUpcomingSpecialsField(comedianRawData, special),
      };
    } else {
      if (!isSpecialALatestRelease(special, latest)) return;

      latest = {
        ...latest,
        ...processLatestUpcomingSpecialsField(comedianRawData, special),
      };
    }
  });

  const finalLatestSpecials = reduceLatestSpecialsCount(latest, LATEST_SPECIALS_LIMIT);

  return await db
    .collection('specials')
    .doc('latest')
    .set(finalLatestSpecials)
    .then(() => db.collection('specials').doc('upcoming').set(upcoming));
};

// given a object of specials, sort by "dateField" & limit the results to "num"

const reduceLatestSpecialsCount = (specials: IUpcomingLatestSpecials, num: number) => {
  const array = [];
  for (const data in specials) {
    array.push(specials[data]);
  }
  return array
    .sort((a, b) => {
      const aDate = parseISO(a.release_date);
      const bDate = parseISO(b.release_date);
      return isAfter(aDate, bDate) ? -1 : 1;
    })
    .splice(0, num)
    .reduce((prev, curr) => {
      return { ...prev, [curr.id]: { ...curr } };
    }, {});
};

interface INewSpecialsAdded {
  specialRawData: IRawSpecial;
  comedianRawData: IRawComedian;
}

const getAllNewSpecialsAndUpdateDB = async () => {
  const allComediansDocData = await getFirebaseDoc('comedians', 'all');
  const allSpecialsDocData = await getFirebaseDoc('specials', 'all');
  const allComedianIds = Object.keys(allComediansDocData).map((id) => Number(id));
  const allExistingSpecialIds = Object.keys(allSpecialsDocData).map((id) => Number(id));
  const allNewSpecials = <INewSpecialsAdded[]>[];

  // promises allow us to execute all db updates before issuing notifications
  const updateDbWithNewSpecials = allComedianIds.reduce(async (accumulatorPromise, comedianId) => {
    return accumulatorPromise.then(() => {
      return updateDbWithAComediansNewSpecials(comedianId, allExistingSpecialIds)
        .then((newSpecials) => {
          if (!newSpecials) return;
          (newSpecials as INewSpecialsAdded[]).forEach((newSpecial) =>
            allNewSpecials.push(newSpecial),
          );
        })
        .catch((e) => {
          console.log(e);
        });
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
const updateDbWithAComediansNewSpecials = (comedianId: number, allExistingSpecialIds: number[]) => {
  return new Promise(async (resolve, reject) => {
    const fetchedSpecialsRawData = await fetchTmdbSpecialsData(comedianId);
    const missingSpecialsRawData = fetchedSpecialsRawData.filter((fetchedSpecial: IRawSpecial) => {
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
      await addSpecialsToLatestOrUpcomingSpecialsDocs(comedianRawData, missingSpecialsRawData);

      // update /comedianPages/{comedianId}/
      await addComedianPageDoc(comedianRawData, fetchedSpecialsRawData);

      // update all /specialPages/ related to comedian, adding a link to this new special
      await addSpecialsPageDocs(comedianRawData, fetchedSpecialsRawData);

      console.log(
        `--> New Special Added! ${comedianRawData.name} (qty: ${missingSpecialsRawData.length})`,
      );

      // used to issue notifications from the parent function call
      const addedSpecials = <INewSpecialsAdded[]>missingSpecialsRawData.map(
        (special: IRawSpecial) => {
          return { specialRawData: special, comedianRawData };
        },
      );

      return resolve(addedSpecials);
    } catch (e) {
      console.log(`--> ERROR: a comedian's specials were NOT updated.`);
      return reject(e);
    }
  });
};

// notifications are created after new specials are found during updates
// - stored in: /users/{uid}/notifications: []

const issueAllNotifications = async (allNewSpecials: INewSpecialsAdded[]) => {
  await allNewSpecials.forEach(async ({ comedianRawData, specialRawData }) => {
    const comedianId = comedianRawData.id;

    const comedianSubscribersDocRef = db
      .collection('comedianSubscribers')
      .doc(comedianId.toString());

    const comedianSubscribersDocResponse = await comedianSubscribersDocRef.get();
    const hasHadASubscriber = comedianSubscribersDocResponse.exists;
    if (!hasHadASubscriber) return;

    const comedianSubscribersData = comedianSubscribersDocResponse.data();
    const hasActiveSubscribers = Object.keys(comedianSubscribersData).length > 0;
    if (!hasActiveSubscribers) return;

    // "upcoming", "today", "available"
    const releaseDateType = getReleaseDateType(specialRawData);

    const subscriberEmailBccList = Object.keys(comedianSubscribersData).reduce((prev, id) => {
      return `${prev}${comedianSubscribersData[id].email},`;
    }, '');

    try {
      await sendEmailNotifications(
        subscriberEmailBccList,
        releaseDateType,
        specialRawData,
        comedianRawData,
      );
    } catch (e) {
      console.log(`--> ERROR: Email notification fail.`);
      console.log(e);
    }

    const allSubscriberUserIds = Object.keys(comedianSubscribersData);

    for await (const userId of allSubscriberUserIds) {
      try {
        await createFrontendUserNotification(+userId, comedianRawData, specialRawData);
      } catch (e) {
        console.log(`--> ERROR: Unable to create front end notification for ${userId}\n${e}`);
        console.log(e);
      }
    }
  });

  console.log('--> Successfully issued notifications');
  return;
};

const createFrontendUserNotification = async (
  userId: number,
  comedianRawData: IRawComedian,
  specialRawData: IRawSpecial,
) => {
  const notification = processUserNotification(comedianRawData, specialRawData);
  return await db
    .collection('users')
    .doc(userId.toString())
    .update({
      notifications: FieldValue.arrayUnion(notification),
    });
};

const sendEmailNotifications = async (
  subscriberEmailBccList: string,
  releaseDateType: 'upcoming' | 'today' | 'available',
  specialRawData: IRawSpecial,
  comedianRawData: IRawComedian,
) => {
  const { id, title, poster_path } = specialRawData;
  const { name } = comedianRawData;

  const imgStyle = `max-width: 400px; max-height: 600px; border-radius: 8px;`;
  const imgElement = poster_path
    ? `<img alt=${title} src=${getTMDBImageURL(poster_path)} style="${imgStyle}"/></tr>`
    : '';
  const headerElement = `<h1 style="margin-bottom: 0; line-height: 1; margin-inline: auto;">thecomedydb</h1>`;
  const pElement = `<p>A favorite comedian of yours has a new special! Check it out at the link below:</p>`;
  const specialTitleElement = `<a href="https://comedy.bmilcs.com/specials/${id}"><h2>${title}</h2></a>`;
  const bodyStyle = `color: #1a1b26; text-align: center;`;
  const globalBodyContent = `${headerElement}${pElement}${specialTitleElement}${imgElement}`;
  const messageBody = `<body style="${bodyStyle}">${globalBodyContent}</body>`;

  let subject;

  if (releaseDateType === 'upcoming') {
    subject = `${name}'s new comedy special is coming out soon!`;
  } else if (releaseDateType === 'today') {
    subject = `${name}'s new comedy special is available today!`;
  } else {
    subject = `${name}'s comedy special is available!`;
  }

  const message = {
    from: GMAIL_EMAIL,
    bcc: subscriberEmailBccList,
    subject: subject,
    html: messageBody,
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_EMAIL, pass: GMAIL_PASSWORD },
  });

  return await transporter.sendMail(message);
};

// checks /specials/upcoming for specials released today.
// if found, it moves the special to /specials/latest
// and returns an array of specials released today (an array
// is used in case multiple specials come out on the same day)

const getTodaysReleasesAndMoveToLatestDoc = async () => {
  try {
    const upcomingSpecialsData = await getFirebaseDoc('specials', 'upcoming');
    const upcomingSpecialIds = Object.keys(upcomingSpecialsData);

    const noUpcomingReleases = upcomingSpecialIds.length === 0;
    if (noUpcomingReleases) return;

    const todaysReleasesDbData = upcomingSpecialIds
      .filter((specialId) => {
        const specialData = upcomingSpecialsData[specialId];
        return isSpecialReleasedToday(specialData);
      })
      .map((specialId) => upcomingSpecialsData[specialId]);

    const noReleasesToday = todaysReleasesDbData.length === 0;
    if (noReleasesToday) return;

    for await (const specialData of todaysReleasesDbData) {
      const specialId = specialData.id;
      console.log(`--> ${specialData.name}'s new special is released today!`);

      // delete special from /specials/upcoming
      await db
        .collection('specials')
        .doc('upcoming')
        .update({
          [specialId]: FieldValue.delete(),
        });

      // add todays release to /specials/latest
      const currentLatestSpecials = await getFirebaseDoc('specials', 'latest').catch(() => {
        return {};
      });

      const newLatestSpecials = { ...currentLatestSpecials, [specialId]: specialData };
      const finalLatestSpecials = reduceLatestSpecialsCount(
        newLatestSpecials,
        LATEST_SPECIALS_LIMIT,
      );
      await db.collection('specials').doc('latest').set(finalLatestSpecials);

      console.log(`--> SUCCESS: Moved ${specialData.name}'s special from /upcoming to /latest`);
    }

    return todaysReleasesDbData;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

// issueAllNotifications() expects an array of {comedianRawData, specialRawData}
// and the special's data for this fn is pulled from /specials/upcoming
// therefore, todays releases need to be processed before passing them to
// issueAllNotifications()

const issueNotificationsForTodaysReleases = async (specialsDbData: IUpcomingLatestSpecials) => {
  const todaysReleasesParsedForNotifications = [];

  for await (const specialData of Object.values(specialsDbData)) {
    const specialId = specialData.id;
    const { comedianId } = specialData;

    const comedianRawData = await fetchTmdbComedianData(comedianId);
    const specialsRawData = await fetchTmdbSpecialsData(comedianId);

    const specialRawData = specialsRawData.reduce((prev: IRawSpecial, curr: IRawSpecial) => {
      if (Number(curr.id) !== Number(specialId)) return prev;
      return { ...prev, ...curr };
    }, {});

    todaysReleasesParsedForNotifications.push({ comedianRawData, specialRawData });
  }

  return await issueAllNotifications(todaysReleasesParsedForNotifications);
};

// notifications are deleted when a user clicks on the notification dropdown link

exports.deleteUserNotification = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data: IDataContentId, context: CallableContext) => {
    // appcheck w/ recaptcha v3
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This function must be called from an App Check verified app.',
      );
    }

    const userId = context.auth?.uid;
    const specialId = data.id;

    if (!userId)
      throw new functions.https.HttpsError('failed-precondition', 'User must be logged in');

    try {
      const userData = await getFirebaseDoc('users', userId);
      const userNotifications = userData.notifications;

      const updatedUserNotifications = userNotifications.filter(
        (notification: IUserNotification) => notification.special.id.toString() !== specialId,
      );

      return await db.collection('users').doc(userId).update({
        notifications: updatedUserNotifications,
      });
    } catch (e) {
      console.log('Unable to remove user notification');
      throw new functions.https.HttpsError('failed-frontend-notification', e);
    }
  });

// user favorite toggling
// - updates personal favorites: /users/{userId}/favorites: [] array
// - updates content favorite count: /comedians/all/{comedianId} (or /specials/all): favorites: +/-1;

interface IComedianOrSpecial {
  backdrop_path: string;
  comedianId: number;
  release_date: string;
  name: string;
  id: number;
  title: string;
  poster_path: string;
}

interface IToggleUserFavoriteData {
  favoriteId: number;
  data: IComedianOrSpecial;
}

exports.toggleUserFavorite = functions
  .runWith({
    enforceAppCheck: true,
  })
  .https.onCall(async (data: IToggleUserFavoriteData, context: CallableContext) => {
    // app check w/ recaptcha v3
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This function must be called from an App Check verified app.',
      );
    }

    if (TEST_MODE) {
      testGetAllNewSpecialsAndUpdateDb();
      testProcessUpcomingSpecials();
      return;
    }

    const userId = context.auth?.uid;
    const userEmail = context.auth?.token.email;
    const userDocRef = db.collection('users').doc(userId);

    if (!userId)
      throw new functions.https.HttpsError('failed-precondition', 'User must be logged in');
    if (!userEmail)
      throw new functions.https.HttpsError('failed-precondition', 'User must have an email');

    // favoriteId: "category-tmdbId" (ie: "comedians-123456789", "specials-123456789")
    const favoriteId = data.favoriteId.toString();
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

        if (category === 'comedians') await unsubscribeUserToComedian(+userId, userEmail, +tmdbId);
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
        if (category === 'comedians') await subscribeUserToComedian(+userId, userEmail, +tmdbId);
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

const subscribeUserToComedian = async (userId: number, userEmail: string, comedianId: number) => {
  // console.log(`Subscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  return await comedianSubscribersDocRef.set(
    {
      [userId]: {
        id: userId,
        email: userEmail,
      },
    },
    { merge: true },
  );
};

const unsubscribeUserToComedian = async (userId: number, userEmail: string, comedianId: number) => {
  // console.log(`Unsubscribing: ${userEmail} (${userId}) to ${comedianId}`);
  const comedianSubscribersDocRef = db.collection('comedianSubscribers').doc(comedianId);
  return await comedianSubscribersDocRef.update({
    [userId]: FieldValue.delete(),
  });
};

// update top favorite comedians & specials on a schedule

const updateTopFavorites = async () => {
  const comediansAllDocData = await getFirebaseDoc('comedians', 'all');
  const specialsAllDocData = await getFirebaseDoc('specials', 'all');

  const updatedTopComediansData = getNewTopFavorites(comediansAllDocData, TOP_COMEDIANS_LIMIT);
  const updatedTopSpecialsData = getNewTopFavorites(specialsAllDocData, TOP_SPECIALS_LIMIT);

  const updateTopComedians = db
    .collection('comedians')
    .doc('topFavorites')
    .set(updatedTopComediansData);

  const updateTopSpecials = db
    .collection('specials')
    .doc('topFavorites')
    .set(updatedTopSpecialsData);

  return updateTopComedians()
    .then(() => updateTopSpecials())
    .then(() => {
      console.log('Successfully updated top favorites');
    })
    .catch((e: Error) => {
      console.log('Failed to update top favorites.');
      console.log(e);
    });
};

interface IAllSpecialsDocData {
  [key: string]: {
    id: number;
    title: string;
    release_date: string;
    favorites: number;
    backdrop_path?: string;
    poster_path?: string;
  };
}

interface IAllComediansDocData {
  [key: string]: {
    id: number;
    name: string;
    favorites: number;
    profile_path?: string;
  };
}

const getNewTopFavorites = (
  allComediansOrAllSpecialsDocData: IAllComediansDocData | IAllSpecialsDocData,
  favoriteCountLimit: number,
) => {
  return Object.keys(allComediansOrAllSpecialsDocData)
    .map((id: string) => {
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

// returns true if a special's date is after one of the latest specials dates
const isSpecialALatestRelease = (
  special: IRawSpecial,
  latestSpecialsObj: IUpcomingLatestSpecials,
) => {
  const specialDate = parseISO(special.release_date);
  // when /specials/latest is empty, accept any special as a latest release
  if (Object.keys(latestSpecialsObj).length < LATEST_SPECIALS_LIMIT) return true;
  for (const existingSpecial in latestSpecialsObj) {
    const existingDate = parseISO(latestSpecialsObj[existingSpecial].release_date);
    const isMoreRecent = isAfter(specialDate, existingDate);
    if (isMoreRecent) {
      return true;
    }
  }
  return false;
};

// db retrieval functions

const getFirebaseDoc = async <T>(collection: string, doc: string) => {
  return db
    .collection(collection)
    .doc(doc)
    .get()
    .then((document: DocumentSnapshot) => {
      if (!(document && document.exists)) throw Error(`--> /${collection}/${doc} doesn't exist`);
      return document.data();
    })
    .then((data: T) => {
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
// TESTS
//

// this test deletes random specials from the database & runs an update.
// it checks that the deleted specials are found & added back to the db
const testGetAllNewSpecialsAndUpdateDb = async () => {
  console.log('--> TEST START');

  const allSpecialsInDb = await getFirebaseDoc('specials', 'all');
  const allSpecialIdsInDb = Object.keys(allSpecialsInDb);
  const randomSpecialsToDelete = <{ id: number; title: string }[]>[];

  // delete 3 random specials from the db
  for (let x = 0; x < 3; x++) {
    const randomIndex = getRandomInt(allSpecialIdsInDb.length);
    const specialId = allSpecialIdsInDb[randomIndex];
    const specialTitle = allSpecialsInDb[specialId].title;
    randomSpecialsToDelete.push({ id: +specialId, title: specialTitle });
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

  // test notifications
  await issueAllNotifications(updatedSpecials);

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

const getRandomInt = (maxVal: number) => Math.floor(Math.random() * (maxVal - 0) + 0);

const testProcessUpcomingSpecials = async () => {
  const today = formatDate(getTodayObj());
  const tomorrow = formatDate(addDays(getTodayObj(), 1));

  const specialThatsReleasedToday = {
    437752: {
      comedianId: 109708,
      name: 'Bill Burr',
      backdrop_path: '/tWJpuxlBDoBnVyDM6dBh0NmuZ73.jpg',
      id: 437752,
      poster_path: '/voxVt0OOD7OxLQApHhmc7IZ4co2.jpg',
      release_date: today,
      title: 'TODAYS RELEASE TEST',
    },
  };

  const specialThatsUpcoming = {
    1068114: {
      comedianId: 109708,
      name: 'Bill Burr',
      backdrop_path: '/tWJpuxlBDoBnVyDM6dBh0NmuZ73.jpg',
      id: 1068114,
      poster_path: '/voxVt0OOD7OxLQApHhmc7IZ4co2.jpg',
      release_date: tomorrow,
      title: 'UPCOMING RELEASE TEST',
    },
  };

  const upcomingSpecialsMock = { ...specialThatsReleasedToday, ...specialThatsUpcoming };

  try {
    await db
      .collection('specials')
      .doc('upcoming')
      .update({
        ...upcomingSpecialsMock,
      });

    console.log('--> TEST Started');
    console.log('--> Added Specials to /specials/upcoming with release date of today & tomorrow');

    // const todaysReleases = await getTodaysReleasesAndMoveToLatestDoc();
    // await issueNotificationsForTodaysReleases(todaysReleases);

    console.log('--> SUCCESS: Completed process upcoming specials test');
  } catch (e: any) {
    console.log(`--> TEST ERROR: ${e.message}`);
  }
};
