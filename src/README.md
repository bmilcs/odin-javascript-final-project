# Whiteboard

## TODO

### **Backend**

On a daily+ interval: run a scan on all comedians in the database

- [x] Fetch TMDB data: all specials per comedian Id
- [x] Fetch database data: /specials/all
- [x] Filter out existing/duplicate specials

- [x] **Add missing specials to the db:**

  - [x] /specials/all/
  - [x] /specials/latest and /specials/upcoming
  - [x] /specialPages/{id}
    - [x] Update _other special pages_ by the same comedian with a link to the new content

- [x] **Add special to all users who subscribe to the comedian**

  - [x] _Another database collection may be needed to store list of users per comedian_ **Looping through all user documents will be expensive**)
  - [x] ie: /userFavorites/{comedianId}/userIds: [];
  - [x] If a new special by a favorite comedian is released:
  - [x] Add a db entry users/{id}/notifications: []

For email notifications:

- [ ] Setup another database collection for email notifications OR store the info in RAM to execute after fetching all specials
  - [ ] /notifications/pending/user-email: { specials: [] }

### Segment Favorites & Subscriptions

- [ ] Clearly divide functionality between favorites/subscriptions

### **Authentication**

- [ ] Add email authentication
- [x] Create sign up form
- [x] Create a login form
- [x] Make a toggle for logging into Google vs Email

### Notifications

- [x] On login / first render, check /user/{id}/notifications array
  - [x] If not empty, pull info & display an overlay
  - [x] Show notification badge

### **GUI Improvements**

- [ ] Search Page

  - [ ] Fix responsiveness
  - [ ] Fix modal for small screens

- [ ] Search Bar

  - [ ] Show "missing comedian? add here" option

- [ ] Global Improvements

  - [ ] Add style variations for comedian & standup arrays
    - [ ] Hero / carousel showcase
    - [ ] Styled list w/ special images for bullet point
    - [ ] Different card styles
  - [ ] Add transitions & transformations
  - [ ] Add subtle shadows

- [ ] Special Pages

  - [x] add Comedian info & other specials
  - [ ] separate name (small) from special title (large)
  - [ ] if date > today, show red banner
  - [x] hide "Years Ago" if 0

## **Move from a static list of comedians to database entries**

- [x] Add mechanism for users to add comedians
- [x] Convert display functionality to use the database instead of `src/data/`

## **Refactor: getAllSpecialsFromDB and addSpecialToDB**

- [x] Users shouldn't be pulling the full list of specials on each visit to determine if a special needs to be added to the database.
- [x] Convert to Cloud Function
- [x] When a user adds a new comedian, trigger a function to add the specials to the db

## High Level Breakdown

Goal: Content-centric IMDB-like site focused on standup comedy. Users should be able to:

1. Get the latest content in the standup world:
   - Standup Specials
   - _Podcasts_ - if time permits
2. Subscribe to their favorite comics
   - Notifications on new releases
     - Dropdown
     - Notification page
     - Via email

All content will be fetched from the TMDB API, and references to those API endpoints (stored in a Firebase Firestore database) will determine what's displayed on the web site.

## Pages

### All Pages: Header, Footer

- **Header**: site name, search bar, user login, notification icon, settings icon

  - Login Button: Google, Email
    - If logged in, show username & logout
  - Search Input:
    - Comedian names
    - Content: specials
  - Notification Icon
    - Dropdown showing releases w/ links to their page
    - On notification icon click: open notification page
    - On dropdown selection click: open the special/tv/movie page
  - Settings:
    - Opens user profile/settings page

- **Footer**: github link, created by
  - Secondary navigation

### Home: generic comedy stuff

- Recently released specials
- Up & coming special releases
- Recently added comedians
- Advertise benefits of signing up:
  - custom tailored news & notifications
- Recommended Comedians Section (new comedy fans)

### My Feed: favorite comedian news

- Similar to home, but limited to the user's favorites
- Users should be able to:
  - Unsubscribe to comedians
  - Find related comedians - similar taste

### Comedian pages

- Headshot
- Bio
- Specials

### Standup specials

- Image
- Name
- Date
- Description
- Where it's available

### Wishlist: Beyond Scope of this Project

- Automated TMDB List Creation for Radarr use based on user favorites
- Podcast Releases:
  - Pull from RSS feeds?
  - Pull from YouTube channels?
- User interaction
  - Reviews/discussion
  - Messaging
- Comedian pages: TV/Movie Credits
- Home: Movies/TV Shows that have comedians in them
- As people subscribe to comedians, comedians with a higher like count should rise to the top

## Strategy

### State Management

Global state needed everywhere:

- Login status
- List of all favorites: people-APIid, standup-APIid (array)
  - As content is fetched, it needs to be:
    - classified by type: person/special(aka movie)
    - check if favorites `.includes()` a user favorite
    - tied to the DOM via data-attribute

### Database Essential Info

Global data:

- comedian data (api id, favorite count/info)
- special data (api id, favorite count/info)

User data:

- name
- array of favorites

### API Data vs. Database Data

Goal: Limit read/writes/amount of data in the Firestore database

- Store API keys (references to where the data lives on TMDB), making clients responsible for fetching the bulk of the data from TMDB
  - May have poor performance & API limit issues
- Adding new comedians & specials to the database should occur:
  - Manually adding them to the site

## Search Feature

- To reduce calls to the db, retrieve & store comedian TMDB api id's data on initial page load
- SearchBar component should search our site's database
  - At the bottom of the autocomplete dropdown, add a "Can't find someone? Add a comedian here" page link
- Add Comedian Page:
  - Utilize TMDB's person search API
  - Can't directly restrict results to comedians/keywords
  - Instead, allow the user to load the `/comedians/{tmdbApi}` page
  - The '/comedians/{tmdbApi}' performs the discover api search by default
    - If standup special keyword exists for person, allow user to officially add them to the db via a large button
- Convert links to buttons for tab navigation
- Fix tab order

## Navigation

- Add hamburger menu for small screens
- Expand on larger screens
- Animate page transitions

## Firestore: Query Types Needed

- Store comedian id once added through "Add new comedian" feature
  - Add comedian favoriteCount variable: increment when user likes a comedian
  - Add image URL's to the db
  - Add 'most liked' comedian spotlight carousel on homepage

### **All comedians**

1. all comedians page
2. search bar

We don't want to overload the TMDB api or have to query 100's of documents in Firebase when retrieving the full list of comedian's id, name & image url.

> Note: each document query counts towards billing

- Firebase recommends documents w/ less than 100 fields
- A master list of comedians (that people are aware of and following) should fall under 100

**Collection**: /comedians/all/

```js
"id": {
  name: "Tom Segura",
  id: 123456,
  // /src/api/ has utility function for recreating full url:
  profile_path: "09ujoidahfi2h3f0hadf.jpg",
  dateAdded: timestamp,
  favoriteCt: 5
}
```

### Recently added comedians (new)

1. Store the last 5 comedians added

- Firebase function
- Trigger: when new comedian is added

  - add the new comedian
  - sort by dateAdded
  - remove the oldest in the list

**Collection**: /comedians/new

```js
"id": {
  name: "Tom Segura",
  id: 123456,
  // /src/api/ has utility function for recreating full url:
  profile_path: "09ujoidahfi2h3f0hadf.jpg",
  dateAdded: timestamp,
  // don't need favorite count here
}
```

### Specials: Recently Released & Up and Coming

1. Store the last 10 specials that were released
2. Store all specials that aren't released yet

**Collection #1**: /specials/new
**Collection #2**: /specials/upcoming

**Firebase function #1**

_Trigger_: when changes are made to /specials/all/ list

- first, check if release date > today
  - if yes, add to up & coming section
  - if no, continue:

> utility function: used by function #2 below as well

- get previous 10 latest specials: /specials/new/
- sort by dateAdded
- loop through new additions
  - if release < last on list, skip iteration
  - if release > last on list, splice special into the correct position
- lastly, remove the last special

**Firebase Function #2**

_Trigger_: on a daily basis, ie: 3am eastern time

- check up & coming specials list
  - if release date = today,
    - fire utility function above:
      - move to recently released specials list
      - remove oldest in the list

**Collection**: /specials/new/ & /specials/upcoming example field:

```js
"id": {
  title: "Ball Hog",
  id: 123456,
  comedianName: "Tom Segura",
  profile_path: "inasdnfoasndf.jpg",
  release_date: timestamp,
}
```

### Comedian & Special Likes: Top Favorites, Total Favorite Counts

1. Store each user's list of favorites:
2. Store all likes & keep a total count for all comedians/specials
3. Store top 10 comedians, sorted by most likes
4. Store top 10 specials, sorted by most likes

**Collections**:

- /users/{id}/ _favorites: []_
- /comedians/favorites/
- /specials/favorites/

**Firebase Function:**

_Trigger_: user adds or removes like status (special/comedian).

- on add:
  - push to /users/{id}/favorites array
  - increment comedian/special favorite counts
- on remove:
  - remove from /users/{id}/favorites array
  - decrement comedian/special favorite counts

## Database Structure (Revised)

```
/users/
  {id}/
    email
    name
    id
    favorites

/comedians/
  all/
    "id": {
      name:      "Tom Segura",
      id:        123456,
      profile_path:   "09ujoidahfi2h3f0hadf.jpg",
      dateAdded: timestamp,
      favorites: 5
    }
  new/
    "id": {
      name:      "Tom Segura",
      id:        123456,
      profile_path:   "09ujoidahfi2h3f0hadf.jpg",
      dateAdded: timestamp,
    }

/specials/
  all/
    "id": {
      title:      "Ball Hog",
      id:         123456,
      profile_path:    "09ujoidahfi2h3f0hadf.jpg",
      comedian:   "Tom Segura",
      comedianId: 2093409234
      favorites:  5
    }
  new/
    "id": {
      title:     "Ball Hog",
      id:        123456,
      release_date: "1/1/25",
      profile_path:   "09ujoidahfi2h3f0hadf.jpg",
      comedian:  "Tom Segura",
    }
  upcoming/
    "id": {
      title:     "Ball Hog",
      id:        123456,
      release_date: "1/1/25",
      profile_path:   "09ujoidahfi2h3f0hadf.jpg",
      comedian:  "Tom Segura",
    }

```

### POSSIBLE FUTURE QUERIES:

- Podcasts: image, url, releases
- Comments: comedians/specials
