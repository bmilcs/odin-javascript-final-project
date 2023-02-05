# TMDB API

- [Example Endpoints](https://www.themoviedb.org/documentation/api/discover)
- [Official API Documentation](https://developers.themoviedb.org/3/authentication/how-do-i-generate-a-session-id)

## Keyword ID's

9716 Stand-up Comedy

## Person ID's

109708 Bill Burr
1238012 Tom Segura

## /discover/

Results:

```js
// api response.json()
{
  results: [
    // images
    poster_path,
    backdrop_path,

    // details
    id,
    title,
    original_title,
    overview,
    release_date,
    popularity,
    vote_average,
    vote_count,
    video,
  ]
  total_results: #, //
}
```

## /person/{personId}

Details: `https://api.themoviedb.org/3/person/{person_id}`

Results:

```js

```
