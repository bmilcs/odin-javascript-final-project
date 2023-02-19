import { getTMDBImageURL, getIMDBURL } from "@/api/TMDB";
import AppearancesGrid from "@/components/AppearancesGrid/AppearancesGrid";
import SpecialsGrid from "@/components/SpecialsGrid/SpecialsGrid";
import useFetchPersonalAndSpecialsData from "@/hooks/useFetchPersonalAndSpecialsData";
import { formatDateNumberOfYearsPassed } from "@/utils/date";
import { useParams } from "react-router-dom";
import "./Comedian.scss";

// TODO validate incoming api ID

function Comedian() {
  const { personId } = useParams();
  const { specials, appearances, personalData } =
    useFetchPersonalAndSpecialsData(Number(personId));

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
