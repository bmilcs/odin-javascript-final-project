# Whiteboard

## High Level Breakdown

Goal: Content-centric IMDB-like site focused on standup comedy. Users should be able to:

1. Get the latest content in the standup world:
   - Standup Specials
   - Movies/TV appearances
   - _Podcasts_ - if time permits
2. Subscribe to their favorite comics
   - Notifications on new releases
     - Dropdown
     - Notification page
     - Via email
3. Submit reviews & openly discuss everything

## Pages

### All Pages: Header, Footer

- **Header**: site name, search bar, user login, notification icon, settings icon

  - Login Button: Google, Email
    - If logged in, show username & logout
  - Search Input:
    - Comedian names
    - Content: movies/tv/specials
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
- Feed of other media: Movies/TV Shows that have comedians in them

### My Feed: favorite comedian news

- Similar to home, but limited to the user's favorites
- Users should be able to:
  - Unsubscribe to comedians
  - Find related comedians - similar taste

### Comedian pages

- Headshot
- Bio
- Their work: specials, tv, movies
- Reviews/discussion

### Standup specials/Movies/TV Show pages

- Image
- Name
- Date
- Description
- Where it's available
- Reviews/discussion

### Wishlist:

- Podcast Releases:
  - Pull from RSS feeds?
  - Pull from YouTube channels?

## Strategy

### State Management

Global state needed everywhere:

- Login status
- Heart status for all content (array)
  - As content is generated, it needs to check if it `.includes()` a user favorite
  - Content grabbed from API needs to be classified by type: person, movie, special, tv to reference appropriate array in user db

### Database

Global data:

- top comedians for recommendations
  - manual list of people id's
  - wishlist: as people subscribe to comedians, those with a higher like count should rise to the top

User data:

- heart status
  - array of: personId's
  - array of: movieId's
  - array of: specialId's
- comments/reviews

Content data:

- tie user comments/reviews to comedian/media pages

<!-- TODO FINISH DATA STRUCTURE -->

WORK IN PROGRESS:

users (collection)
..userId (document)
....name (field)
....email (field)
....people (field > map)
......favorite (array) _ contentIds
......comment (array) _ contentIds
....movie (field > map)
......favorite (array) _ contentIds
......comment (array) _ contentIds
....standup (field > map)
......favorite (array) _ contentIds
......comment (array) _ contentIds

content (collection)
..person (document)
....contentId (field)
....favoriteCount (field)
....comments (field > map)
...... comment data
..movie (document)
....contentId (field)
....favoriteCount (field)
....comments (field > map)
...... comment data
..tv (document)
....contentId (field)
....favoriteCount (field)
....comments (field > map)
...... comment data

comments (collection)
..commentId (document)
....userId (field)
....contentId (field)
....text (field)
....timestamp (field)
