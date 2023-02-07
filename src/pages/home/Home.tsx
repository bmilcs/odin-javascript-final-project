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
  getMovieDetailsURL,
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
  const movieDetailsURL = getMovieDetailsURL(497520);

  const { data: specialsData, error: specialsError } = useFetch(specialsUrl);
  const { data: tvData, error: tvError } = useFetch(tvUrl);
  const { data: movieData, error: movieError } = useFetch(movieUrl);
  const { data: personalData, error: personalError } = useFetch(personalUrl);
  const { data: imagesData, error: imagesError } = useFetch(imagesUrl);
  const { data: searchData, error: searchError } = useFetch(searchUrl);
  const { data: movieDetailsData, error: movieDetailsError } =
    useFetch(movieDetailsURL);

  useEffect(() => {
    console.log(movieDetailsURL);
    console.log("MOVIE DATA", movieDetailsURL);
  }, [movieDetailsURL]);

  return (
    <div className="test">
      <div className="person">
        <p>.name: {personalData && personalData.name}</p>
        <p>.id: {personalData && personalData.id}</p>
        <p>.birthday: {personalData && personalData.birthday}</p>
        <p>.biography: {personalData && personalData.biography}</p>
        <p>{personalData && personalData.imdb_id}</p>
        {personalData && (
          <img
            src={`https://image.tmdb.org/t/p/original/${personalData.profile_path}`}
            alt=""
          ></img>
        )}
      </div>

      <div className="specials section">
        {specialsData &&
          specialsData.results.map((special: any) => {
            // console.log("special:", special);
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
                .poster_path:
                <img
                  src={`https://image.tmdb.org/t/p/original/${special.poster_path}`}
                />
              </div>
            );
          })}
      </div>

      <div className="tv section">
        {tvData &&
          tvData.cast.map((tv: any) => {
            // console.log("tv:", tv);
            return (
              <div>
                <h2>{tv.name}</h2>
                <p>{tv.overview}</p>
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
            // console.log("movie:", movie);
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
    </div>
  );
}

export default Home;
