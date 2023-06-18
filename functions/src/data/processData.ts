//
// Comedian Pages
//

interface IComedianPage {
  comedian: IComedianPageComedian;
  specials: IReleaseCard[];
  appearances: IReleaseCard[];
}

interface IComedianPageComedian {
  name: string;
  id: number;
  profile_path: string;
  biography?: string;
  birthday?: string;
  imdb_id?: string;
}

interface IReleaseCard {
  id: number;
  title: string;
  release_date: string;
  poster_path?: string;
  backdrop_path?: string;
}

exports.processComedianPage = (comedianRawData: IRawComedian, specialsRawData: IRawSpecial[]) => {
  const comedian = {
    name: comedianRawData.name,
    id: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
    ...(comedianRawData.biography && { biography: comedianRawData.biography }),
    ...(comedianRawData.birthday && { birthday: comedianRawData.birthday }),
    ...(comedianRawData.imdb_id && { imdb_id: comedianRawData.imdb_id }),
  };

  const specials = <IReleaseCard[]>[];
  const appearances = <IReleaseCard[]>[];

  specialsRawData.forEach((special: IRawSpecial) => {
    const contentData = {
      id: +special.id,
      title: special.title,
      release_date: special.release_date,
      ...(special.poster_path && { poster_path: special.poster_path }),
      ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
    };

    if (isSpecial(comedianRawData.name, special.title)) {
      specials.push(contentData);
    } else if (isAppearance(comedianRawData.name, special.title)) {
      appearances.push(contentData);
    }
  });

  const pageData = {
    comedian,
    specials,
    appearances,
  };

  return pageData;
};

//
// Special Pages
//

interface ISpecialPage {
  comedian: ISpecialPageComedian;
  special: ISpecialPageSpecial;
  otherSpecials: IReleaseCard[];
  otherAppearances: IReleaseCard[];
}

interface ISpecialPageComedian {
  id: number;
  name: string;
  profile_path: string;
}

interface ISpecialPageSpecial {
  id: number;
  title: string;
  release_date: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  runtime?: string;
  status?: string;
  homepage?: string;
}

exports.processSpecialPages = (
  comedianRawData: IRawComedian,
  specialsRawData: IRawSpecial[],
): ISpecialPage[] => {
  // needed for each special page
  const comedian = {
    name: comedianRawData.name,
    id: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
  };

  // each special page features the details of the targeted special
  // and provides links to other content by the same comedian
  const specialPages = specialsRawData.map((page) => {
    const special = {
      id: +page.id,
      title: page.title,
      type: isSpecial(comedianRawData.name, page.title) ? 'special' : 'appearance',
      release_date: page.release_date,
      ...(page.poster_path && { poster_path: page.poster_path }),
      ...(page.backdrop_path && { backdrop_path: page.backdrop_path }),
      ...(page.overview && { overview: page.overview }),
      ...(page.runtime && { runtime: page.runtime }),
      ...(page.status && { status: page.status }),
      ...(page.homepage && { homepage: page.homepage }),
    };

    const otherSpecials = <IReleaseCard[]>[];
    const otherAppearances = <IReleaseCard[]>[];

    specialsRawData.forEach((otherContent) => {
      // skip the current special
      if (page.id === otherContent.id) return;

      const otherContentData = {
        id: otherContent.id,
        title: otherContent.title,
        release_date: otherContent.release_date,
        ...(otherContent.poster_path && { poster_path: otherContent.poster_path }),
        ...(otherContent.backdrop_path && { backdrop_path: otherContent.backdrop_path }),
      };

      if (isSpecial(comedianRawData.name, otherContent.title)) {
        otherSpecials.push(otherContentData);
      } else if (isAppearance(comedianRawData.name, otherContent.title)) {
        otherAppearances.push(otherContentData);
      }
    });

    return {
      comedian,
      special,
      otherSpecials,
      otherAppearances,
    };
  });

  return specialPages;
};

//
// /comedians/all/{fields}
//

exports.processAllComediansField = (comedianRawData: IRawComedian) => {
  const comedian = {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      profile_path: comedianRawData.profile_path,
      favorites: 0,
    },
  };

  return comedian;
};

//
// /specials/all/{fields}
//

exports.processAllSpecialsFields = (specialsRawData: IRawSpecial[]) => {
  const specials = specialsRawData.reduce((prev, special) => {
    return {
      ...prev,
      [special.id]: {
        id: special.id,
        title: special.title,
        release_date: special.release_date,
        favorites: 0,
        ...(special.poster_path && { poster_path: special.poster_path }),
        ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
      },
    };
  }, {});

  return specials;
};

//
// /users/{id}/notifications
//

interface IUserNotification {
  comedian: {
    name: string;
    id: number;
    profile_path?: string;
  };
  special: {
    id: number;
    title: string;
    release_date: string;
    poster_path?: string;
    backdrop_path?: string;
  };
}

exports.processUserNotification = (comedianRawData: IRawComedian, specialRawData: IRawSpecial) => {
  const notification = {
    comedian: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      ...(comedianRawData.profile_path && { profile_path: comedianRawData.profile_path }),
    },
    special: {
      id: specialRawData.id,
      title: specialRawData.title,
      release_date: specialRawData.release_date,
      ...(specialRawData.poster_path && { poster_path: specialRawData.poster_path }),
      ...(specialRawData.backdrop_path && { backdrop_path: specialRawData.backdrop_path }),
    },
  };

  return notification;
};

//
// Latest Comedians Field
//

exports.processLatestComediansField = (comedianRawData: IRawComedian, date: string) => {
  return {
    [comedianRawData.id]: {
      name: comedianRawData.name,
      id: comedianRawData.id,
      dateAdded: date,
      ...(comedianRawData.profile_path && { profile_path: comedianRawData.profile_path }),
    },
  };
};

//
// Latest / Upcoming Special Fields
//

interface IUpcomingLatestSpecials {
  [id: string]: {
    comedianId: number;
    name: string;
    id: number;
    title: string;
    release_date: string;
    poster_path?: string;
    backdrop_path?: string;
  };
}

exports.processLatestUpcomingSpecialsField = (
  comedianRawData: IRawComedian,
  specialRawData: IRawSpecial,
) => {
  return {
    [specialRawData.id]: {
      comedianId: comedianRawData.name,
      name: comedianRawData.name,
      id: specialRawData.id,
      title: specialRawData.title,
      release_date: specialRawData.release_date,
      ...(specialRawData.poster_path && { poster_path: specialRawData.poster_path }),
      ...(specialRawData.backdrop_path && { backdrop_path: specialRawData.backdrop_path }),
    },
  };
};

const isSpecial = (comedianName: string, title: string) => {
  const [firstName, lastName] = comedianName.split(' ');
  const titlePrefix = title.split(':')[0];
  const isSpecial = title.includes(firstName) && title.includes(lastName);
  const isAppearance = titlePrefix.includes('Presents');
  return isSpecial && !isAppearance ? true : false;
};

const isAppearance = (comedianName: string, title: string) => {
  const [firstName, lastName] = comedianName.split(' ');
  const titlePrefix = title.split(':')[0];
  const isAppearance =
    titlePrefix.includes('Presents') ||
    !(titlePrefix.includes(firstName) && titlePrefix.includes(lastName));
  return isAppearance ? true : false;
};
