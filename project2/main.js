// my api key
const API_KEY = "eda4ea3c405d46ac97f0bd43b3afd243";
const BASE_URL = "https://api.rawg.io/api/games";

// get today to block future games
const today = new Date().toISOString().split('T')[0];

window.onload = () => {
    initApp();
};

// start the app
function initApp() {
    // grab last search
    const savedTerm = localStorage.getItem("lastSearchTerm");
    if (savedTerm) {
        document.querySelector("#search-term").value = savedTerm;
    }

    // click to search
    document.querySelector("#search-btn").addEventListener("click", handleSearch);

    // show trending first
    loadTrendingGames();
}

// load hot games
function loadTrendingGames() {
    document.querySelector("#status").innerHTML = "Trending Games This Month (Alphabetical)";
    
    // get recent games
    const url = `${BASE_URL}?key=${API_KEY}&dates=2025-10-01,${today}&ordering=-added&page_size=15`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // sort a to z
            const sortedGames = data.results.sort((a, b) => a.name.localeCompare(b.name));
            displayResults(sortedGames);
        })
        .catch(error => {
            document.querySelector("#status").innerHTML = "Error loading data.";
        });
}

// do the search
function handleSearch() {
    // grab inputs
    const term = document.querySelector("#search-term").value.trim();
    const platform = document.querySelector("#platform").value;
    const sort = document.querySelector("#sort").value;

    // stop if empty
    if (!term && !platform && !sort) {
        document.querySelector("#status").innerHTML = "Please enter a search term or select a filter!";
        return;
    }

    // save it
    if (term) {
        localStorage.setItem("lastSearchTerm", term);
    }

    document.querySelector("#status").innerHTML = "Searching...";

    // build url
    let searchUrl = `${BASE_URL}?key=${API_KEY}&page_size=20`;
    
    if (term) {
        searchUrl += `&search=${encodeURIComponent(term)}`;
    }
    
    // add platform
    if (platform) {
        searchUrl += `&parent_platforms=${platform}`;
    }
    
    // add sort
    if (sort) {
        searchUrl += `&ordering=${sort}`;
        // fix the future games bug
        if (sort === '-released') {
            searchUrl += `&dates=1990-01-01,${today}`;
        }
    }

    // go get data
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            document.querySelector("#status").innerHTML = `Found ${data.count} Results`;
            displayResults(data.results);
        })
        .catch(error => {
            document.querySelector("#status").innerHTML = "Error loading data.";
        });
}

// show games on page
function displayResults(games) {
    const grid = document.querySelector("#game-grid");
    // clear old stuff
    grid.innerHTML = ""; 

    // if nothing found
    if (games.length === 0) {
        grid.innerHTML = "<p>No games found matching your criteria.</p>";
        return;
    }

    // loop games
    for (let game of games) {
        const card = document.createElement("div");
        card.className = "game-card";

        // cover pic
        const img = document.createElement("img");
        img.src = game.background_image ? game.background_image : "https://via.placeholder.com/400x200?text=No+Cover";
        img.alt = game.name;

        const infoDiv = document.createElement("div");
        infoDiv.className = "info";

        // name
        const title = document.createElement("h3");
        title.innerHTML = game.name;

        // genres
        const genreList = document.createElement("p");
        if (game.genres && game.genres.length > 0) {
            genreList.innerHTML = game.genres.map(g => g.name).join(", ");
        } else {
            genreList.innerHTML = "Genre: Unknown";
        }

        // scores
        const scoreBadge = document.createElement("div");
        scoreBadge.className = "score-badge";
        
        // meta score first
        if (game.metacritic) {
            scoreBadge.innerHTML = `Metacritic: ${game.metacritic}`;
            if (game.metacritic >= 75) scoreBadge.classList.add("meta-high");
            else if (game.metacritic >= 50) scoreBadge.classList.add("meta-mid");
            else scoreBadge.classList.add("meta-low");
        } 
        // fallback to user score
        else if (game.rating > 0) {
            scoreBadge.innerHTML = `User Score: ${game.rating}/5`;
            scoreBadge.classList.add("user-score");
        } 
        // no score
        else {
            scoreBadge.innerHTML = "Unrated";
            scoreBadge.classList.add("no-score");
        }

        // put together
        infoDiv.appendChild(title);
        infoDiv.appendChild(genreList);
        infoDiv.appendChild(scoreBadge); 
        card.appendChild(img);
        card.appendChild(infoDiv);
        
        // append
        grid.appendChild(card);
    }
}