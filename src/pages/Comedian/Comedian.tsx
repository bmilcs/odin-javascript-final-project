import {
  getAllSpecialsForPersonURL,
  getPersonDetailsURL,
  getTMDBImageURL,
  getIMDBURL,
  TDiscoverMovieResult,
} from "@/api/TMDB";
import SpecialCard from "@/components/SpecialCard/SpecialCard";
import useFetch from "@/hooks/useFetch";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Comedian.scss";

// TODO validate incoming api ID

function Comedian() {
  const { personId } = useParams();
  const id = personId ? Number(personId) : 0;
  const comedianURL = getPersonDetailsURL(id);
  const specialsURL = getAllSpecialsForPersonURL(id);
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

  // separate comedy specials "Comedian Name: Special Title" from
  // appearances / other credits: "Comedian Name Presents:"
  // & titles without the comedians name
  useEffect(() => {
    if (
      specialsData &&
      specialsData.results &&
      personalData &&
      personalData.name
    ) {
      setSpecials(
        specialsData.results.filter((special: TDiscoverMovieResult) => {
          const specialTitle = special.title!.toString();
          const comedianName = personalData.name;
          const isSpecial = specialTitle.includes(comedianName);
          const isNotAppearance = !specialTitle.includes(
            `${comedianName} Presents`
          );
          return isSpecial && isNotAppearance;
        })
        // .sort((a, b) => )
      );
      setAppearances(
        specialsData.results.filter((appearance: TDiscoverMovieResult) => {
          const appearanceTitle = appearance.title!.toString();
          const comedianName = personalData.name;
          const isAppearance =
            appearanceTitle.includes(`${comedianName} Presents`) ||
            !appearanceTitle.includes(comedianName);
          return isAppearance;
        })
      );
    }
  }, [specialsData, personalData]);

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
                <p className="comedian__birthday">
                  Born: {personalData.birthday}
                </p>
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

      <section className="specials">
        <h3 className="specials__header">Specials</h3>
        <div className="specials__grid">
          {specials &&
            specials.map((special: TDiscoverMovieResult) => (
              <SpecialCard {...special} />
            ))}
        </div>
      </section>

      <section className="appearances">
        <h3 className="appearances__header">Appearances & Credits</h3>
        <div className="appearances__grid">
          {appearances &&
            appearances.map((appearance: TDiscoverMovieResult) => (
              <SpecialCard {...appearance} />
            ))}
        </div>
      </section>
    </div>
  );
}

export default Comedian;
