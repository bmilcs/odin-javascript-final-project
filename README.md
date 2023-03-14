# Odin Project #23: JavaScript Final Project

Welcome to Bryan Miller's JavaScript Final Project, the [twenty third assignment](https://www.theodinproject.com/lessons/node-path-javascript-javascript-final-project) within the Odin Project curriculum. The goal of this repo is to practice the following skill sets:

- [**Whiteboarding**](src/README.md): project planning
- **Vite**: React, TypeScript + SWC
- **Firebase** (BaaS)
- npm packages:
  - `firebase`
  - `react-redux` (`@types/react-redux`)
  - `@reduxjs/toolkit` (`@types/react-redux`)
  - `react-router-dom` 
  - `react-icons` (`@types/react-icons`)
  - `uuid` (`@types/uuid`)
  - `date-fns`
  - `sass`
  - `gh-pages`

## Links

- [Live Demo](https://bmilcs.com/odin-javascript-final-project)
- [My Odin Project Progress](https://github.com/bmilcs/odin-project)

## Summary

In progress...

## Challenges Overcame

### Async Thunk & Circular Dependencies Issue

The `Cannot access '<slice name>' before initialization (store.ts)` error message popped up numerous times during the development of this app. This was a new and unfamiliar error that wouldn't go away.

The first time it appeared was when trying to access `allComediansDataArr` in a react component via `useAppSelector(allComediansDataArr)`:

```tsx
// redux tool kit slice: /src/features/allComediansSlice
export const allComediansDataArr = (state: RootState) => state.allComedians.data;

// redux tool kit store: /src/app/store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Reverting back to the non-Typescript way of accessing state variables from a slice (`useSelector(state => state.allComedians.data`) did the trick.

```tsx
const dispatch = useAppDispatch();
dispatch(fetchAllComedians());
```

Then, the async thunk function call (`fetchAllComedians()`) on initial page render (`src/app/App.tsx`) caused the error yet again. After a significant amount of research and troubleshooting, I came across a solution that stuck... fixing all circular dependency issues going forward:

**Instead of importing slice state variables directly from their modules, I re-exported all redux-related variables from the store itself**:

```ts
export * from '@/features/allComediansSlice/allComediansSlice';
export * from '@/features/allSpecialsSlice/allSpecialsSlice';
export * from '@/features/userSlice/userSlice';
```

_This was a true victory._

### 404 Error: Manually typing in URL & Refreshing Pages

Previous projects utilizing `react-router-dom` caused 404 errors when any path (other than the base path) was refreshed or manually entered in the address bar. After some research, I came across this [article](https://medium.com/@itspaulolimahimself/deploying-a-react-js-spa-app-to-github-pages-58ddaa2897a3), containing instructions from the [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages) repo.

The fix required adding a custom 404 page (`public/404.html`) and a script to my index.html (`src/index.html`).

### "Specials" API Responses: Missing Comedian ID

When directly visiting `/specials/{tmdbId}`, the id of the special is retrieved from the url via `useParams()`, which is then used to fetch the data from TMDB. However, the TMDB Discovery API's response doesn't contain the comedian's ID. This presented a problem: if a user directly visits a standup special URL, the app wouldn't be able to fetch the comedian's information & other work in a "View this comedian's other work" section.

> To be continued

### Adding New Comedians & TMDB People Search API

My goal for the search field on the site was to query TMDB for people who have media that contains the standup comedy keyword. Unfortunately, TMDB People Search API doesn't allow you to filter by anything other than the search query (person's name).

> To be continued

## Screenshots

In progress...

## Deployment

```sh
# clone repo & change directories
git clone https://github.com/bmilcs/odin-javascript-final-project
cd javascript-final-project

# install all dependencies
npm install

# run app
npm start
```
