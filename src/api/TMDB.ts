const API_KEY = import.meta.env.VITE_API_KEY;
const STANDUP_KEYWORD = 9716;

//
// api url assembly functions
//

interface TMDBDiscoverRequest {
  keywords?: number | undefined;
  without_keywords?: number | undefined;
  person?: number | undefined;
}

//
// tmdb's /discover/ api
//

export const tmdbDiscoverURL = ({
  keywords,
  without_keywords,
  person,
}: TMDBDiscoverRequest): string => {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;
  if (keywords) url += `&with_keywords=${keywords}`;
  if (without_keywords) url += `&without_keywords=${without_keywords}`;
  if (person) url += `&with_cast=${person}`;
  return url;
};

export const getAllSpecialsForPersonURL = (personId: number): string => {
  return tmdbDiscoverURL({
    person: personId,
    keywords: STANDUP_KEYWORD,
  });
};

export const getMoviesForPersonURL = (personId: number): string => {
  return tmdbDiscoverURL({
    person: personId,
    without_keywords: STANDUP_KEYWORD,
  });
};

//
// tmdb's /person/ api
//

export const getTVShowsForPersonURL = (personId: number): string => {
  return `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${API_KEY}`;
};
