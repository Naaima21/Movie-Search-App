const API_KEY = "202adde16e209c0d948decaa07e9670e";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_PATH = "https://image.tmdb.org/t/p/original";
const IMG_PATH_BG = "https://image.tmdb.org/t/p/w1280"; // Medium/HD size
const IMG_PATH_SMALL = "https://image.tmdb.org/t/p/w200";

// Elements
const mainNav = document.getElementById("main-nav"); // The whole navbar
const homeView = document.getElementById("home-view");
const detailsView = document.getElementById("details-view");
const libraryView = document.getElementById("library-view");
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("search-suggestions");

let currentItem = null;
let library = JSON.parse(localStorage.getItem("cinescope_lib")) || [];

function showError(message) {
  const homeView = document.getElementById("home-view");
  homeView.innerHTML = `
    <div style="text-align:center; padding:100px 20px; color:#ccc;">
      <h2 style="color:#e50914; margin-bottom:10px;">Oops!</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="margin-top:20px; padding:10px 25px; background:#e50914; color:white; border:none; border-radius:20px; cursor:pointer;">
        Try Again
      </button>
    </div>
  `;
}
function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

// 1. Initial Setup

async function init() {
  try {
    showLoader();
    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&include_adult=false&without_genres=10749,10766&vote_count.gte=200`,
    );
    if (!res.ok) throw new Error("Failed to fetch movies");
    const data = await res.json();

    const safeMovies = data.results.filter((movie) => {
      const hasRomance = movie.genre_ids && movie.genre_ids.includes(10749);
      return !hasRomance && movie.poster_path;
    });

    const collageGrid = document.getElementById("collage-grid");
    collageGrid.innerHTML = safeMovies
      .slice(0, 12)
      .map(
        (item) =>
          `<img src="${IMG_PATH_SMALL + item.poster_path}" alt="poster">`,
      )
      .join("");

    renderGrid(safeMovies, "trending-grid");
  } catch (err) {
    console.error(err);
    showError(
      "Movies are not loading! Check your internet connection and try again.",
    );
  } finally {
    hideLoader();
  }
}

//  Genre Filtering
let allGenres = [];

async function loadGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    if (!res.ok) throw new Error("Failed to fetch genres");
    const data = await res.json();
    allGenres = data.genres;

    const genreBar = document.getElementById("genre-bar");
    genreBar.innerHTML =
      `<span class="genre-pill active" data-id="all">All</span>` +
      allGenres
        .map(
          (g) =>
            `<span class="genre-pill" data-id="${g.id}" data-name="${g.name}">${g.name}</span>`,
        )
        .join("");
  } catch (err) {
    console.error(err);
  }
}

async function filterByGenre(genreId, genreName) {
  try {
    showLoader();
    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`,
    );
    if (!res.ok) throw new Error("Failed to fetch genre movies");
    const data = await res.json();

    document.getElementById("grid-title").innerText = `${genreName} Movies`;
    renderGrid(data.results, "trending-grid");
    setActivePill(genreId);
  } catch (err) {
    console.error(err);
    showError("Genre's movies cannot load.");
  } finally {
    hideLoader();
  }
}

function resetToTrending() {
  document.getElementById("grid-title").innerText = "Trending Now";
  init();
  setActivePill("all");
}

function setActivePill(id) {
  document.querySelectorAll(".genre-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.id == id);
  });
}

function renderGrid(items, containerId) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = items
    .map((item) => {
      if (!item.poster_path) return "";
      const title = item.title || item.name;
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
      const type = item.media_type || (item.title ? "movie" : "tv");
      return `
            <div class="movie-card" data-id="${item.id}" data-type="${type}">
                <span class="card-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                <img src="${IMG_PATH_SMALL + item.poster_path}" alt="${title}"  loading="lazy">
                <h3>${title}</h3>
            </div>
        `;
    })
    .join("");
}

// 2. Search Logic
let timeoutId;
searchInput.addEventListener("input", (e) => {
  clearTimeout(timeoutId);
  const query = e.target.value.trim();
  if (query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  timeoutId = setTimeout(async () => {
    const res = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&include_adult=false`,
    );
    const data = await res.json();

    const filtered = data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 5);
    if (filtered.length === 0) {
      suggestionsBox.innerHTML = `<div class="no-results">No matches found</div>`;
      suggestionsBox.classList.remove("hidden");
      return;
    }

    suggestionsBox.innerHTML = filtered
      .map(
        (item) => `
        <div class="suggestion-item" data-id="${item.id}" data-type="${item.media_type}">
           <img src="${item.poster_path ? IMG_PATH_SMALL + item.poster_path : "https://via.placeholder.com/40x60"}" alt="poster">
            <div>
                <h4 style="font-size:14px">${item.title || item.name}</h4>
                <p style="font-size:12px; color:#ccc">${item.media_type.toUpperCase()} • ${(item.release_date || item.first_air_date || "").substring(0, 4)}</p>
            </div>
        </div>
    `,
      )
      .join("");
    suggestionsBox.classList.remove("hidden");
  }, 400);
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(timeoutId);
    const query = e.target.value.trim();
    if (query.length < 2) return;
    performSearch(query);
  }
});
document.getElementById("search-icon-btn").addEventListener("click", () => {
  clearTimeout(timeoutId);
  const query = searchInput.value.trim();
  if (query.length < 2) return;
  performSearch(query);
});

async function performSearch(query) {
  try {
    suggestionsBox.classList.add("hidden");
    const res = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&include_adult=false`,
    );
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();

    const filtered = data.results.filter(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path,
    );

    if (filtered.length === 0) {
      showError(`"${query}" was not found `);
      return;
    }

    if (filtered.length === 1) {
      const only = filtered[0];
      navigateToMovie(only.id, only.media_type);
      return;
    }

    goHome();
    document.getElementById("grid-title").innerText = `Results for "${query}"`;
    renderGrid(filtered, "trending-grid");
  } catch (err) {
    console.error(err);
    showError("Search failed, try again.");
  }
}

function selectMovie(id, type) {
  suggestionsBox.classList.add("hidden");
  searchInput.value = "";
  navigateToMovie(id, type);
}

// 3. Fetch Full Details
async function fetchDetails(id, type) {
  try {
    const res = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,watch/providers`,
    );
    const data = await res.json();
    currentItem = {
      id: data.id,
      type: type,
      title: data.title || data.name,
      poster_path: data.poster_path,
      vote_average: data.vote_average,
    };

    // View Management
    mainNav.classList.add("hidden"); // HIDE FULL NAVBAR
    homeView.classList.add("hidden");
    libraryView.classList.add("hidden");
    detailsView.classList.remove("hidden");
    window.scrollTo(0, 0);

    // Update UI
    document.getElementById("bg-image").style.backgroundImage =
      `url('${IMG_PATH_BG + (data.backdrop_path || data.poster_path)}')`;
    document.getElementById("title").innerText = currentItem.title;

    const runtime =
      data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null);
    document.getElementById("runtime").innerText = runtime
      ? `${runtime} min`
      : "";
    document.getElementById("year").innerText = (
      data.release_date ||
      data.first_air_date ||
      ""
    ).substring(0, 4);
    document.getElementById("type-badge").innerText =
      type === "tv" ? "SERIES" : "MOVIE";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    document.getElementById("rating").innerHTML =
      `<i class="fa-solid fa-star"></i> ${rating}`;

    document.getElementById("genres").innerHTML = (data.genres || [])
      .map((g) => `<span class="pill">${g.name}</span>`)
      .join("");
    if (data.credits && data.credits.cast) {
      document.getElementById("cast").innerHTML = data.credits.cast
        .slice(0, 5)
        .map((c) => `<span class="pill">${c.name}</span>`)
        .join("");
    }

    let directors =
      type === "movie" && data.credits
        ? data.credits.crew.filter((c) => c.job === "Director")
        : data.created_by || [];
    document.getElementById("directors").innerHTML = directors
      .map((d) => `<span class="pill">${d.name}</span>`)
      .join("");

    document.getElementById("summary").innerText = data.overview;
    const providersBox = document.getElementById("providers");
    const providersSection = document.getElementById("providers-section");
    const allProviders = data["watch/providers"]?.results || {};

    const regionData =
      allProviders["PK"] ||
      allProviders["US"] ||
      Object.values(allProviders)[0];

    const flatrate = regionData?.flatrate || [];

    if (flatrate.length === 0) {
      providersSection.style.display = "none";
    } else {
      providersSection.style.display = "block";
      providersBox.innerHTML = flatrate
        .map(
          (p) =>
            `<span class="pill provider-pill">
          <img src="${IMG_PATH_SMALL + p.logo_path}" alt="${p.provider_name}">
          ${p.provider_name}
        </span>`,
        )
        .join("");
    }

    const trailer = data.videos?.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    const trailerBtn = document.getElementById("trailer-btn");
    if (trailer) {
      trailerBtn.style.display = "flex";
      trailerBtn.onclick = () => {
        document.getElementById("trailer-iframe").src =
          `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        document.getElementById("trailer-modal").classList.remove("hidden");
      };
    } else trailerBtn.style.display = "none";

    updateLibBtnState();
  } catch (err) {
    console.error(err);
    navigateHome();
    showError(
      "This title is not found. Perhaps the link is wrong or the movie is removed.",
    );
  }
}
//  URL Routing
function navigateHome() {
  window.location.hash = "";
}

function navigateToLibrary() {
  window.location.hash = "#/library";
}

function navigateToMovie(id, type) {
  window.location.hash = `#/movie/${type}/${id}`;
}

function router() {
  const hash = window.location.hash;

  if (hash.startsWith("#/movie/")) {
    const parts = hash.split("/"); // ["#", "movie", "movie-or-tv", "12345"]
    const type = parts[2];
    const id = parts[3];
    fetchDetails(id, type);
  } else if (hash === "#/library") {
    showLibrary();
  } else {
    goHome();
  }
}
// 4. View Switching
function goHome() {
  mainNav.classList.remove("hidden"); // SHOW NAVBAR
  detailsView.classList.add("hidden");
  libraryView.classList.add("hidden");
  homeView.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function showLibrary() {
  mainNav.classList.add("hidden"); // HIDE NAVBAR
  homeView.classList.add("hidden");
  detailsView.classList.add("hidden");
  libraryView.classList.remove("hidden");
  renderGrid(library, "library-grid");
  window.scrollTo(0, 0);
}

// 5. Library Logic
const libBtn = document.getElementById("add-library-btn");
function updateLibBtnState() {
  const isSaved = library.some((item) => item.id === currentItem.id);
  if (isSaved) {
    libBtn.classList.add("active");
    libBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
  } else {
    libBtn.classList.remove("active");
    libBtn.innerHTML = '<i class="fa-solid fa-folder-plus"></i>';
  }
}

libBtn.addEventListener("click", () => {
  const index = library.findIndex((item) => item.id === currentItem.id);
  if (index === -1) library.push(currentItem);
  else library.splice(index, 1);

  localStorage.setItem("cinescope_lib", JSON.stringify(library));
  updateLibBtnState();
});
// Event Delegation
document.getElementById("logo").addEventListener("click", navigateHome);
document
  .getElementById("library-btn")
  .addEventListener("click", navigateToLibrary);
document
  .getElementById("details-back-btn")
  .addEventListener("click", navigateHome);
document
  .getElementById("library-back-btn")
  .addEventListener("click", navigateHome);

document.addEventListener("click", (e) => {
  const card = e.target.closest(".movie-card");
  if (card) {
    navigateToMovie(card.dataset.id, card.dataset.type);
  }
});

document.getElementById("genre-bar").addEventListener("click", (e) => {
  const pill = e.target.closest(".genre-pill");
  if (!pill) return;
  if (pill.dataset.id === "all") {
    resetToTrending();
  } else {
    filterByGenre(pill.dataset.id, pill.dataset.name);
  }
});

suggestionsBox.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (item) {
    selectMovie(item.dataset.id, item.dataset.type);
  }
});

// Click outside  suggestions close
document.addEventListener("click", (e) => {
  const searchContainer = document.getElementById("search-container");
  if (searchContainer && !searchContainer.contains(e.target)) {
    suggestionsBox.classList.add("hidden");
  }
});

// Modal Logic
document.getElementById("close-modal").addEventListener("click", closeVideo);
document.getElementById("trailer-modal").addEventListener("click", (e) => {
  if (e.target.id === "trailer-modal") closeVideo();
});
function closeVideo() {
  document.getElementById("trailer-modal").classList.add("hidden");
  document.getElementById("trailer-iframe").src = "";
}

init();
loadGenres();
window.addEventListener("hashchange", router);
router();
