import {
  getAllSpecialsForPersonURL,
  getPersonDetailsURL,
  IDiscoverMovieResult,
  IDiscoverMovieResultsApiResponse,
  IPersonDetailsResult,
} from '@/api/TMDB';
import useFetch from '@/hooks/useFetch';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

// given a tmdb person id, fetch their personal details, specials & appearances

function useFetchPersonalAndSpecialsData(personId: number) {
  let id = personId;
  const comedianURL = getPersonDetailsURL(id);
  const specialsURL = getAllSpecialsForPersonURL(id);
  const { data: personalData, setUrl: setPersonalUrl } =
    useFetch<IPersonDetailsResult>(comedianURL);
  const { data: specialsData, setUrl: setSpecialsUrl } =
    useFetch<IDiscoverMovieResultsApiResponse>(specialsURL);
  const [specials, setSpecials] = useState<null | IDiscoverMovieResult[]>(null);
  const [appearances, setAppearances] = useState<null | IDiscoverMovieResult[]>(null);

  const changePerson = (newPersonId: number) => {
    id = newPersonId;
  };

  useEffect(() => {
    setPersonalUrl(comedianURL);
    setSpecialsUrl(specialsURL);
  }, [id]);

  // separate comedy specials: "Comedian Name: Special Title"
  // from appearances / other credits:
  // - "Comedian Name Presents:"
  // - titles without the comedians name

  useEffect(() => {
    if (specialsData && specialsData.results && personalData && personalData.name !== undefined) {
      const sortedSpecials = specialsData.results
        .filter((movie: IDiscoverMovieResult) => {
          const title = movie.title;
          const [firstName, lastName] = personalData.name.split(' ');
          const titlePrefix = title.split(':')[0];

          const isSpecial = title.includes(firstName) && title.includes(lastName);
          const isNotAppearance = !titlePrefix.includes('Presents');

          return isSpecial && isNotAppearance;
        })
        .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult): number => {
          return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
        });

      const sortedAppearances = specialsData.results
        .filter((movie: IDiscoverMovieResult) => {
          const title = movie.title;
          const [firstName, lastName] = personalData.name.split(' ');
          const titlePrefix = title.split(':')[0];

          const isAppearance =
            titlePrefix.includes('Presents') ||
            !(titlePrefix.includes(firstName) && titlePrefix.includes(lastName));

          return isAppearance;
        })
        .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult) =>
          isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1,
        );

      setSpecials(sortedSpecials);
      setAppearances(sortedAppearances);
    }
  }, [specialsData, personalData]);

  return { specials, appearances, personalData, changePerson };
}

export default useFetchPersonalAndSpecialsData;
