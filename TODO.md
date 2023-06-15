# Jun 14

Immediate:

- Update backend special pages processing to use an array
- Update frontend special pages to use an array (follow Comedian page format)
- Update types for API call responses

Big Picture updates:

- Improve consistency of types on back & frontend
- Continue to segment backend into modules & scope functions to 1 job
- Continue converting potentially missing object keys from tmdb api calls to:

```ts
// reduce wasted space in the database (performance, etc.)
{
  ...(someValue && {property: someValue})
}
```
