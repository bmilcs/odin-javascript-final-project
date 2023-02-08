//
// api url assembly functions
//

const API_KEY = import.meta.env.VITE_API_KEY;
const STANDUP_KEYWORD = 9716;

//
// tmdb's /discover/ api
//

interface TMDBPersonRequest {
  keywords?: number | undefined;
  without_keywords?: number | undefined;
  personId?: number | undefined;
}

export const tmdbDiscoverURL = ({
  keywords,
  without_keywords,
  personId: person,
}: TMDBPersonRequest): string => {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;
  if (keywords) url += `&with_keywords=${keywords}`;
  if (without_keywords) url += `&without_keywords=${without_keywords}`;
  if (person) url += `&with_cast=${person}`;
  return url;
};

export const getAllSpecialsForPersonURL = (personId: number): string => {
  return tmdbDiscoverURL({
    personId: personId,
    keywords: STANDUP_KEYWORD,
  });
};

export const getMoviesForPersonURL = (personId: number): string => {
  return tmdbDiscoverURL({
    personId: personId,
    without_keywords: STANDUP_KEYWORD,
  });
};

//
// tmdb's /movie/ api
//

export const getMovieDetailsURL = (movieId: number): string => {
  return `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
};

//
// tmdb's /person/ api
//

interface TMDBPersonRequest {
  requestType?: string | undefined;
  keywords?: number | undefined;
  without_keywords?: number | undefined;
  personId?: number | undefined;
}

export const tmdbPersonURL = ({
  requestType,
  keywords,
  without_keywords,
  personId,
}: TMDBPersonRequest): string => {
  let url = `https://api.themoviedb.org/3/person/${personId}`;
  requestType
    ? (url += `/${requestType}?api_key=${API_KEY}`)
    : (url += `?api_key=${API_KEY}`);
  if (keywords) url += `&with_keywords=${keywords}`;
  if (without_keywords) url += `&without_keywords=${without_keywords}`;
  return url;
};

export const getTVShowsForPersonURL = (personId: number): string => {
  return tmdbPersonURL({ personId: personId, requestType: "tv_credits" });
};

export const getPersonDetailsURL = (personId: number): string => {
  return tmdbPersonURL({ personId: personId });
};

export const getPersonExternalIdsURL = (personId: number): string => {
  return tmdbPersonURL({ personId: personId, requestType: "external_ids" });
};

export const getPersonImagesURL = (personId: number): string => {
  return tmdbPersonURL({ personId: personId, requestType: "images" });
};

//
// search apis
//

interface TMDBSearchRequest {
  query: string;
  requestType: string | undefined;
}

export const tmdbSearchUrl = ({
  query,
  requestType,
}: TMDBSearchRequest): string => {
  const parsedQuery = parseSearchQuery(query);
  let url = `https://api.themoviedb.org/3/search/${requestType}?api_key=${API_KEY}`;
  url += `&query=${query}`;
  return url;
};

const parseSearchQuery = (string: string): string => {
  return string === undefined
    ? ""
    : string
        .replace(/[^a-z0-9_]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
};

export const searchForPersonURL = (name: string): string => {
  return tmdbSearchUrl({ query: name, requestType: "person" });
};

export const searchAllURL = (name: string): string => {
  return tmdbSearchUrl({ query: name, requestType: "multi" });
};
