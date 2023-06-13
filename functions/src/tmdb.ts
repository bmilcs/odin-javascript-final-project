// the movie database api

const { functions } = require('./index.js');

const API_KEY = functions.config().tmdb.key;

interface IRawComedian {
  adult: boolean;
  also_known_as: string[];
  biography: string;
  birthday: string;
  deathday: string | null;
  gender: number;
  homepage: string;
  id: number;
  imdb_id: string;
  known_for_department: string;
  name: string;
  place_of_birth: string;
  popularity: number;
  profile_path: string;
}

exports.fetchTmdbComedianData = async (comedianId: number) => {
  const comedianUrl = getPersonDetailsURL(comedianId);
  const comedianData = await fetchData<IRawComedian>(comedianUrl);
  return comedianData;
};

interface IRawComedySpecial {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

type IRawComedySpecialArray = IRawComedySpecial[];

interface IRawComedySpecialAPIResponse {
  page: number;
  results: IRawComedySpecialArray;
  total_pages: number;
  total_results: number;
}

exports.fetchTmdbSpecialsData = async (comedianId: number) => {
  const specialsUrl = getAllSpecialsForPersonURL(comedianId);
  const { results: specialsData } = await fetchData<IRawComedySpecialAPIResponse>(specialsUrl);
  return specialsData;
};

const getTMDBImageURL = (path: string) => {
  return `https://image.tmdb.org/t/p/original/${path}`;
};

const getAllSpecialsForPersonURL = function (personId: number) {
  return `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_keywords=9716&with_cast=${personId}`;
};

const getPersonDetailsURL = function (personId: number) {
  return `https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}`;
};

const fetchData = async function <T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (err) {
    throw err;
  }
};
