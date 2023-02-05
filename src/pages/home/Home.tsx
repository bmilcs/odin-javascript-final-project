import useFetch from "@/hooks/useFetch";
import {
  getAllSpecialsForPersonURL,
  getMoviesForPersonURL,
  getTVShowsForPersonURL,
  getPersonDetailsURL,
  getPersonExternalIdsURL,
  getPersonImagesURL,
  searchForPersonURL,
  searchAllURL,
} from "@/api/TMDB";
import { useEffect } from "react";
import "./Home.scss";

function Home() {
  const tomSeguraId = 1238012;

  const specialsUrl = getAllSpecialsForPersonURL(tomSeguraId);
  const tvUrl = getTVShowsForPersonURL(tomSeguraId);
  const movieUrl = getMoviesForPersonURL(tomSeguraId);
  const personalUrl = getPersonDetailsURL(tomSeguraId);
  const imagesUrl = getPersonImagesURL(tomSeguraId);
  const searchUrl = searchAllURL("Tom Segura");

  const { data: specialsData, specialsError } = useFetch(specialsUrl);
  const { data: tvData, tvError } = useFetch(tvUrl);
  const { data: movieData, movieError } = useFetch(movieUrl);
  const { data: personalData, personalError } = useFetch(personalUrl);
  const { data: imagesData, imagesError } = useFetch(imagesUrl);
  const { data: searchData, searchError } = useFetch(searchUrl);

  useEffect(() => {
    console.log(searchUrl, tvData);
  }, [tvData]);

  return (
    <div className="test">
      <div className="tv section">
        {tvData &&
          tvData.cast.map((tv) => {
            return (
              <div>
                <h2>{tv.name}</h2>
                <img
                  src={`https://image.tmdb.org/t/p/original/${tv.poster_path}`}
                />
              </div>
            );
          })}
      </div>
      <div className="movies section">
        {movieData &&
          movieData.results.map((movie) => {
            return (
              <div>
                <h2>{movie.title}</h2>
                <img
                  src={`https://image.tmdb.org/t/p/original/${movie.poster_path}`}
                />
              </div>
            );
          })}
      </div>
      <div className="specials section">
        {specialsData &&
          specialsData.results.map((special) => {
            return (
              <div>
                <h2>{special.title}</h2>
                <img
                  src={`https://image.tmdb.org/t/p/original/${special.poster_path}`}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Home;
