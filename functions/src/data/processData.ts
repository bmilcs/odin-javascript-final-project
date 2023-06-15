interface IComedianPageContent {
  id: string;
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

  const specials = <IComedianPageContent[]>[];
  const appearances = <IComedianPageContent[]>[];

  specialsRawData.forEach((special: IRawSpecial) => {
    const contentData = {
      id: special.id,
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
    personalData: { ...comedian },
    specials,
    appearances,
  };

  return pageData;
};

exports.processSpecialPages = (comedianRawData: IRawComedian, specialsRawData: IRawSpecial[]) => {
  const comedian = {
    comedian: comedianRawData.name,
    comedianId: comedianRawData.id,
    profile_path: comedianRawData.profile_path,
  };

  // each special page features the details of the targeted special
  // and provides links to the comedian & other content by the same comedian
  const specials = specialsRawData.reduce((prev, special, index) => {
    const categorizedOtherContent = specialsRawData.reduce(
      (prev, special, i) => {
        // skip the current special
        if (index === i) return prev;

        if (isSpecial(comedianRawData.name, special.title)) {
          return {
            ...prev,
            specials: {
              ...prev.specials,
              [special.id]: {
                id: special.id,
                title: special.title,
                release_date: special.release_date,
                ...(special.poster_path && { poster_path: special.poster_path }),
                ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
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
                release_date: special.release_date,
                ...(special.poster_path && { poster_path: special.poster_path }),
                ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
              },
            },
          };
        } else {
          return prev;
        }
      },
      { specials: {}, appearances: {} },
    );

    return {
      ...prev,
      [special.id]: {
        comedian: {
          name: comedianRawData.name,
          id: comedianRawData.id,
          ...(comedianRawData && { profile_path: comedianRawData.profile_path }),
        },
        data: {
          id: special.id,
          title: special.title,
          type: isSpecial(comedianRawData.name, special.title) ? 'special' : 'appearance',
          ...(special.poster_path && { poster_path: special.poster_path }),
          ...(special.backdrop_path && { backdrop_path: special.backdrop_path }),
          ...(special.release_date && { release_date: special.release_date }),
          ...(special.overview && { overview: special.overview }),
          ...(special.runtime && { runtime: special.runtime }),
          ...(special.status && { status: special.status }),
          ...(special.homepage && { homepage: special.homepage }),
        },
        otherSpecials: categorizedOtherContent.specials,
        otherAppearances: categorizedOtherContent.appearances,
      },
    };
  }, {});

  return { comedian, specials };
};

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

exports.processAllSpecialsFields = (specialsRawData: IRawSpecial[]) => {
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

  return specials;
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
