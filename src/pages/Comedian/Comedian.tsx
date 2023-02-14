import {
  getAllSpecialsForPersonURL,
  getPersonDetailsURL,
  getTMDBImageURL,
  getIMDBURL,
  IDiscoverMovieResult,
} from "@/api/TMDB";
import AppearancesGrid from "@/components/AppearancesGrid/AppearancesGrid";
import SpecialsGrid from "@/components/SpecialsGrid/SpecialsGrid";
import { addSpecialToDB, doesSpecialExistInDB } from "@/firebase/database";
import useFetch from "@/hooks/useFetch";
import {
  formatDateNumberOfYearsPassed,
  isDateOneBeforeDateTwo,
} from "@/utils/date";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Comedian.scss";

// TODO validate incoming api ID

function Comedian() {
  const { personId } = useParams();
  const comedianId = personId ? Number(personId) : 0;
  const comedianURL = getPersonDetailsURL(comedianId);
  const specialsURL = getAllSpecialsForPersonURL(comedianId);
  const {
    data: personalData,
    error: personalError,
    isLoading: personalIsLoading,
  } = useFetch(comedianURL);
  const {
    data: specialsData,
    error: specialsError,
    isLoading: specialsIsLoading,
  } = useFetch(specialsURL);
  const [specials, setSpecials] = useState([] as any[]);
  const [appearances, setAppearances] = useState([] as any[]);

  // separate comedy specials "Comedian Name: Special Title"
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
          .filter((special: IDiscoverMovieResult) => {
            const specialTitle = special.title!.toString();
            const comedianName = personalData.name;
            const isSpecial = specialTitle.includes(comedianName);
            const isNotAppearance = !specialTitle.includes(
              `${comedianName} Presents`
            );
            return isSpecial && isNotAppearance;
          })
          .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult) =>
            isDateOneBeforeDateTwo(a.release_date!, b.release_date!) ? 1 : -1
          )
      );
      setAppearances(
        specialsData.results
          .filter((appearance: IDiscoverMovieResult) => {
            const appearanceTitle = appearance.title!.toString();
            const comedianName = personalData.name;
            const isAppearance =
              appearanceTitle.includes(`${comedianName} Presents`) ||
              !appearanceTitle.includes(comedianName);
            return isAppearance;
          })
          .sort((a: IDiscoverMovieResult, b: IDiscoverMovieResult) =>
            isDateOneBeforeDateTwo(a.release_date!, b.release_date!) ? 1 : -1
          )
      );
    }
  }, [specialsData, personalData]);

  // special/appearance data is set once a comedian's info & their content has been fetched
  useEffect(() => {
    if (specials)
      specials.forEach(async (spec) => {
        if (!doesSpecialExistInDB(spec.id)) {
          addSpecialToDB(spec, comedianId, personalData.name);
        }
      });

    if (appearances)
      appearances.forEach(async (spec) => {
        if (!doesSpecialExistInDB(spec.id)) {
          addSpecialToDB(spec, comedianId, personalData.name);
        }
      });
  }, [specials, appearances]);

  return (
    <div className="column">
      <div className="comedian">
        {personalData && (
          <>
            <img
              className="comedian__headshot"
              src={getTMDBImageURL(personalData.profile_path)}
              alt=""
            ></img>
            <div className="comedian__details">
              <h2 className="comedian__name">{personalData.name}</h2>
              {personalData.birthday && (
                <>
                  <p className="comedian__birthday">
                    Born: {personalData.birthday}
                  </p>
                  <p>
                    {formatDateNumberOfYearsPassed(personalData.birthday)} Years
                    Old
                  </p>
                </>
              )}
              {personalData.biography ? (
                <p className="comedian__biography">{personalData.biography}</p>
              ) : (
                <p className="comedian__biography">
                  Unfortunately, {personalData.name} is missing a biography.
                  Show them some love by visiting their themoviedb.org page and
                  write one for them!
                </p>
              )}
              {personalData.imdb_id && (
                <p className="comedian__imdb">
                  <a href={getIMDBURL(personalData.imdb_id)}></a>
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {specials && specials.length > 0 && <SpecialsGrid data={specials} />}

      {appearances && appearances.length > 0 && (
        <AppearancesGrid data={appearances} />
      )}
    </div>
  );
}

export default Comedian;
