# TMDB API

- [Example Endpoints](https://www.themoviedb.org/documentation/api/discover)
- [Official API Documentation](https://developers.themoviedb.org/3/authentication/how-do-i-generate-a-session-id)

## TODO

1. Segment keyword standup comedy results:
   - Specials: always contains: "comedian name: special name"
   - Comedy 'shows', with multiple comedians in them

## Keyword ID's

9716 Stand-up Comedy

## Person ID's

52849 Louis CK
109708 Bill Burr
1238012 Tom Segura
91609 Joe Rogan
4169 Dave Chappelle
2632 Chris Rock
1181310 Andrew Santino
198149 Bobby Lee
1187274 Bert Kreischer
75309 Joey Diaz
1137588 Ari Shaffir
17835 Ricky Gervais
142516 Jim Jefferies
55638 Kevin Hart

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
