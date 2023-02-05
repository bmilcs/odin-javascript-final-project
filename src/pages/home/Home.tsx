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

  const { data: specialsData, error: specialsError } = useFetch(specialsUrl);
  const { data: tvData, error: tvError } = useFetch(tvUrl);
  const { data: movieData, error: movieError } = useFetch(movieUrl);
  const { data: personalData, error: personalError } = useFetch(personalUrl);
  const { data: imagesData, error: imagesError } = useFetch(imagesUrl);
  const { data: searchData, error: searchError } = useFetch(searchUrl);

  return (
    <div className="test">
      <div className="tv section">
        {tvData &&
          tvData.cast.map((tv: any) => {
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
          movieData.results.map((movie: any) => {
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
          specialsData.results.map((special: any) => {
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
