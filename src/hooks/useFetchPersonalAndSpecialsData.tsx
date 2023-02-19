import {
  getAllSpecialsForPersonURL,
  getPersonDetailsURL,
  IDiscoverMovieResult,
} from "@/api/TMDB";
import { addSpecialToDB, doesSpecialExistInDB } from "@/firebase/database";
import useFetch from "@/hooks/useFetch";
import { isDateOneBeforeDateTwo } from "@/utils/date";
import { useEffect, useState } from "react";

function useFetchPersonalAndSpecialsData(personId: number) {
  let id = personId;
  const comedianURL = getPersonDetailsURL(id);
  const specialsURL = getAllSpecialsForPersonURL(id);
  const {
    data: personalData,
    error: personalError,
    isLoading: personalIsLoading,
    setUrl: setPersonalUrl,
  } = useFetch(comedianURL);
  const {
    data: specialsData,
    error: specialsError,
    isLoading: specialsIsLoading,
    setUrl: setSpecialsUrl,
  } = useFetch(specialsURL);
  const [specials, setSpecials] = useState<null | IDiscoverMovieResult[]>(null);
  const [appearances, setAppearances] = useState<null | IDiscoverMovieResult[]>(
    null
  );

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
    if (
      specialsData &&
      specialsData.results &&
      personalData &&
      personalData.name
    ) {
      setSpecials(
        specialsData.results
          .filter((movie: IDiscoverMovieResult) => {
            const title = movie.title!.toString();
            const [firstName, lastName] = personalData.name.split(" ");
            const titlePrefix = title.split(":")[0];

            const isSpecial =
              title.includes(firstName) && title.includes(lastName);
            const isNotAppearance = !titlePrefix.includes("Presents");

            return isSpecial && isNotAppearance;
          })
          .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult) =>
            isDateOneBeforeDateTwo(a.release_date!, b.release_date!) ? 1 : -1
          )
      );

      setAppearances(
        specialsData.results
          .filter((movie: IDiscoverMovieResult) => {
            const title = movie.title!.toString();
            const [firstName, lastName] = personalData.name.split(" ");
            const titlePrefix = title.split(":")[0];

            const isAppearance =
              titlePrefix.includes("Presents") ||
              !(
                titlePrefix.includes(firstName) &&
                titlePrefix.includes(lastName)
              );

            return isAppearance;
          })
          .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult) =>
            isDateOneBeforeDateTwo(a.release_date!, b.release_date!) ? 1 : -1
          )
      );
    }
  }, [specialsData, personalData]);

  // after special/appearance data is fetched
  useEffect(() => {
    const specialsToAddToDB: IDiscoverMovieResult[] = [];

    if (specials && specials.length > 0) {
      specials.forEach((spec) => {
        if (!doesSpecialExistInDB(spec.id!)) {
          specialsToAddToDB.push(spec);
        }
      });
    }

    if (appearances && appearances.length > 0)
      appearances.forEach(async (spec) => {
        if (!doesSpecialExistInDB(spec.id!)) {
          specialsToAddToDB.push(spec);
        }
      });

    if (specialsToAddToDB.length > 0)
      addSpecialToDB(specialsToAddToDB, id, personalData.name);
  }, [specials, appearances]);

  return { specials, appearances, personalData, changePerson };
}

export default useFetchPersonalAndSpecialsData;