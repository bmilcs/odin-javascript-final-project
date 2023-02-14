# Odin Project #23: JavaScript Final Project

Welcome to Bryan Miller's JavaScript Final Project, the [twenty third assignment](https://www.theodinproject.com/lessons/node-path-javascript-javascript-final-project) within the Odin Project curriculum. The goal of this repo is to practice the following skill sets:

- [**Whiteboarding**](src/README.md): project planning
- **Vite**: React, TypeScript + SWC
- **Firebase** (BaaS)
- npm packages:
  - `firebase`
  - `react-redux` (`@types/react-redux`)
  - `@reduxjs/toolkit` (`@types/react-redux`)
  - `react-router-dom` (`@types/react-router-dom`)
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

### 404 Error: Manually typing in URL & Refreshing Pages

Previous projects utilizing `react-router-dom` caused 404 errors when any path (other than the base path) was refreshed or manually entered in the address bar. After some research, I came across this [article](https://medium.com/@itspaulolimahimself/deploying-a-react-js-spa-app-to-github-pages-58ddaa2897a3), containing instructions from the [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages) repo.

The fix required adding a custom 404 page (`public/404.html`) and a script to my index.html (`src/index.html`).

### "Specials" API Responses: Missing Comedian ID

When directly visiting `/specials/{tmdbId}`, the id of the special is retrieved from the url via `useParams()` and then used to fetch the data from TMDB. However, the TMDB Discovery API's response doesn't contain the comedian's ID. This presented a problem: if a user directly visits a standup special URL, the app wouldn't be able to fetch the comedian's information & other work in a "View this comedian's other work" section.

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
