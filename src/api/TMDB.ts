const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchTest = () => {
  const personId = "109708"; // bill burr
  const movieId = "823754";
  const keyword = "9716";

  const discoverPersonFilter = `&with_people=${personId}`;
  const discoverKeyWordFilter = `&with_keywords=${keyword}`;

  const getKeywordsForFilm = `https://api.themoviedb.org/3/movie/${movieId}/keywords?api_key=${API_KEY}`;
  const getPersonImages = `https://api.themoviedb.org/3/person/${personId}/images?api_key=${API_KEY}`;
  const getStandupSpecials = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc${discoverPersonFilter}${discoverKeyWordFilter}`;

  const url = getStandupSpecials;

  return fetch(url)
    .then((response) => response.text())
    .then((text) => JSON.parse(text))
    .then((parsed) => parsed.results);
};
