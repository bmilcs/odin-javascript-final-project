# TODO

Backend:

- [ ] Organize index.ts into modules
  - [ ] utils/firebase: reading/writing to db
  - [ ] tasks/addComedian: creating new comedian page
  - [ ] index.ts:
- [ ] Refactor add Comedian on backend:
  - [ ] Check if a special already exists
    - [ ] If exists, check what comedian(s) are associated with it
      - [ ] If comedian(s) of existing special doesn't contain comedian being added, add the new comedian to the special
      - [ ] If comedian is equal to comedian being added, overwrite it
    - [ ] Else create the new special page
- [x] Update backend special pages processing to use an array
- [x] Update frontend special pages to use an array (follow Comedian page format)
- [x] Update types for API call responses

Big Picture:

- [ ] Improve consistency of types on back & frontend
- [ ] Continue to segment backend into modules & scope functions to 1 job
- [ ] Continue converting potentially missing object keys from tmdb api calls to:

```ts
// reduce wasted space in the database (performance, etc.)
{
  ...(someValue && {property: someValue})
}
```
