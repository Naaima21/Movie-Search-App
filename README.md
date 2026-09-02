# 🎬 CineScope

A Netflix-style movie & TV show discovery app built with vanilla JavaScript, powered by the TMDB API.

## 🔗 Live Demo

## ✨ Features

- Browse trending movies & TV shows
- Search with live suggestions + full search
- Filter by genre
- View detailed info: cast, crew, genres, ratings, trailers
- See where to stream (Netflix, Prime Video, etc.)
- Save titles to a personal library (persisted with localStorage)
- Fully responsive (mobile, tablet, desktop)
- URL-based routing (shareable links, works with browser back/forward)

## 🛠️ Built With

- HTML5, CSS3, Vanilla JavaScript
- [TMDB API](https://www.themoviedb.org/documentation/api)
- Font Awesome icons

## 🚀 Running Locally

1. Clone this repo
2. Get a free API key from [TMDB](https://www.themoviedb.org/settings/api)
3. Replace the `API_KEY` value in `app.js`
4. Open `index.html` in your browser (or use a Live Server extension)

## 📚 What I Learned

- Working with REST APIs and async/await
- Building responsive layouts with media queries
- Managing app state and view-switching in vanilla JS
- Implementing client-side routing with the URL hash

## ⚠️ Security Note Regarding TMDB API Key

In this repository, you will notice that the TMDB API key is exposed in the `app.js` file.

**Why is it public?**
This is a purely static front-end project hosted on GitHub Pages (which does not support backend environments or serverless functions out-of-the-box).

Since the TMDB API key is strictly **read-only** (it only fetches movie data and has no billing risk or write access), I intentionally kept it in the frontend for demonstration purposes. In a real-world production environment, I would proxy these requests through a backend server (e.g., Node.js or Vercel Serverless Functions) and store the key securely in an `.env` file.
