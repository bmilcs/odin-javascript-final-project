# Whiteboard

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

- Advertise benefits of signing up: custom tailored news & notifications
- Recommended Comedians Section (new comedy fans)
- Feed of standup special releases

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

### Database Structure

- **users (collection)**

  - userId (document)
    - userId (field, string)
    - name (field, string)
    - email (field, string)
    - favorites (field, array)
      - category-id (field, string): "person-tmdbAPIid", "standup-tmdbAPIid"

- **comedian (collection)**

  - id: tmdb person api id (document)
    - id ^ (field, number)
    - name (field, string)
    - favoriteCount (field, number)

- **specials (collection)**

  - id: tmdb movie api id (document)
    - id ^ (field, number)
    - title (field, string)
    - comedian (field, string)
    - comedianId (field, number)
    - favoriteCount (field, number)

### API Data vs. Database Data

Goal: Limit read/writes/amount of data in the Firestore database

- Store API keys (references to where the data lives on TMDB), making clients responsible for fetching the bulk of the data from TMDB
  - May have poor performance & API limit issues
- Adding new comedians & specials to the database should occur:
  - On user favoriting them
  - Start off with my personal favorites
- Otherwise, generic/home content should be generated from a static list of predetermined comedians/specials

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
