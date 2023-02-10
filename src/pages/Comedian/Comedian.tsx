import { getAllSpecialsForPersonURL, getPersonDetailsURL } from "@/api/TMDB";
import useFetch from "@/hooks/useFetch";
import { useEffect } from "react";
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

  return (
    <div className="column">
      <div className="person">
        {personalData && (
          <>
            <p>{personalData.name}</p>
            <p>{personalData.id}</p>
            <p>{personalData.birthday}</p>
            <p>{personalData.biography}</p>
            <p>{personalData.imdb_id}</p>
            <img
              className="headshot"
              src={`https://image.tmdb.org/t/p/original/${personalData.profile_path}`}
              alt=""
            ></img>
          </>
        )}
      </div>

      <div className="specials">
        {specialsData && (
          <>
            {specialsData.results.map((special: any) => {
              return (
                <div>
                  <h2>.title: {special.title}</h2>
                  <p>.id: {special.id}</p>
                  <p>.release_date: {special.release_date}</p>
                  <p>.vote_average: {special.vote_average}</p>
                  <p>.overview: {special.overview}</p>
                  .backdrop_path:
                  <img
                    src={`https://image.tmdb.org/t/p/original/${special.backdrop_path}`}
                  />
                  {/* .poster_path:
                  <img
                    src={`https://image.tmdb.org/t/p/original/${special.poster_path}`}
                  /> */}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default Comedian;
