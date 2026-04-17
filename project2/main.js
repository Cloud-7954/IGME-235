// api setup
const API_KEY = "eda4ea3c405d46ac97f0bd43b3afd243";
const BASE_URL = "https://api.rawg.io/api/games";
const today = "2026-04-17"; 

// state tracking
let currentPage = 1;
let savedBaseUrl = ""; 

// setup page
window.onload = function() {
    let savedWord = localStorage.getItem("lastSearchTerm");
    if (savedWord !== null) {
        document.querySelector("#search-term").value = savedWord;
    }

    document.querySelector("#search-btn").addEventListener("click", startSearch);
    document.querySelector("#logo").addEventListener("click", loadHome);
    document.querySelector("#prev-btn").addEventListener("click", goPrevPage);
    document.querySelector("#next-btn").addEventListener("click", goNextPage);

    loadHome();
};

// load trending
function loadHome() {
    document.querySelector("#search-term").value = "";
    document.querySelector("#status").innerHTML = "Trending Games Today";
    currentPage = 1;

    let limit = document.querySelector("#limit").value;
    
    savedBaseUrl = BASE_URL + "?key=" + API_KEY + "&dates=2025-10-01," + today + "&ordering=-added&page_size=" + limit;
    
    getData(savedBaseUrl + "&page=" + currentPage);
}

// run search
function startSearch() {
    let term = document.querySelector("#search-term").value;
    let platform = document.querySelector("#platform").value;
    let sort = document.querySelector("#sort").value;
    let limit = document.querySelector("#limit").value;

    // check empty
    if (term === "" && platform === "" && sort === "") {
        document.querySelector("#status").innerHTML = "Please enter a search term or select a filter!";
        return;
    }

    // save search
    if (term !== "") {
        localStorage.setItem("lastSearchTerm", term);
    }

    document.querySelector("#status").innerHTML = "Searching...";
    currentPage = 1; 

    // build url
    let url = BASE_URL + "?key=" + API_KEY + "&page_size=" + limit;
    
    if (term !== "") {
        url = url + "&search=" + term;
    }
    if (platform !== "") {
        url = url + "&parent_platforms=" + platform;
    }
    if (sort !== "") {
        url = url + "&ordering=" + sort;
        if (sort === "-released") {
            url = url + "&dates=1990-01-01," + today;
        }
    }

    savedBaseUrl = url;
    getData(savedBaseUrl + "&page=" + currentPage);
}

// page back
function goPrevPage() {
    currentPage = currentPage - 1;
    document.querySelector("#status").innerHTML = "Loading Page " + currentPage + "...";
    getData(savedBaseUrl + "&page=" + currentPage);
    window.scrollTo(0, 0); 
}

// page forward
function goNextPage() {
    currentPage = currentPage + 1;
    document.querySelector("#status").innerHTML = "Loading Page " + currentPage + "...";
    getData(savedBaseUrl + "&page=" + currentPage);
    window.scrollTo(0, 0);
}

// get data
function getData(url) {
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            let term = document.querySelector("#search-term").value;
            if (term !== "") {
                document.querySelector("#status").innerHTML = "Found " + data.count + " Results";
            } else {
                document.querySelector("#status").innerHTML = "Trending Games Today";
            }
            
            showGames(data.results);
            setupPagination(data);
        })
        .catch(function(error) {
            document.querySelector("#status").innerHTML = "Error loading data. Please check your connection.";
        });
}

// button logic
function setupPagination(data) {
    let paginationDiv = document.querySelector("#pagination");
    let prevBtn = document.querySelector("#prev-btn");
    let nextBtn = document.querySelector("#next-btn");
    let pageNum = document.querySelector("#page-num");

    if (data.count === 0) {
        paginationDiv.classList.add("hidden");
        return;
    }

    paginationDiv.classList.remove("hidden");
    pageNum.innerHTML = "Page " + currentPage;

    if (currentPage === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }

    if (data.next === null) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

// draw cards
function showGames(games) {
    let grid = document.querySelector("#game-grid");
    grid.innerHTML = ""; 

    if (games.length === 0) {
        grid.innerHTML = "<p>No games found matching your criteria.</p>";
        return;
    }

    for (let i = 0; i < games.length; i++) {
        let game = games[i];

        let card = document.createElement("div");
        card.className = "game-card";

        // cover image
        let img = document.createElement("img");
        if (game.background_image !== null) {
            img.src = game.background_image;
        } else {
            img.src = "https://via.placeholder.com/400x200?text=No+Cover";
        }
        img.alt = game.name;

        let infoDiv = document.createElement("div");
        infoDiv.className = "info";

        let title = document.createElement("h3");
        title.innerHTML = game.name;

        // get genres
        let genreList = document.createElement("p");
        let genreString = "";
        
        if (game.genres !== null && game.genres.length > 0) {
            for (let j = 0; j < game.genres.length; j++) {
                genreString = genreString + game.genres[j].name;
                if (j < game.genres.length - 1) {
                    genreString = genreString + ", ";
                }
            }
            genreList.innerHTML = genreString;
        } else {
            genreList.innerHTML = "Genre: Unknown";
        }

        // get scores
        let scoreBadge = document.createElement("div");
        scoreBadge.className = "score-badge";
        
        if (game.metacritic !== null) {
            scoreBadge.innerHTML = "Metacritic: " + game.metacritic;
            if (game.metacritic >= 75) {
                scoreBadge.classList.add("meta-high");
            } else if (game.metacritic >= 50) {
                scoreBadge.classList.add("meta-mid");
            } else {
                scoreBadge.classList.add("meta-low");
            }
        } else if (game.rating > 0) {
            scoreBadge.innerHTML = "User Score: " + game.rating + "/5";
            scoreBadge.classList.add("user-score");
        } else {
            scoreBadge.innerHTML = "Unrated";
            scoreBadge.classList.add("no-score");
        }

        infoDiv.appendChild(title);
        infoDiv.appendChild(genreList);
        infoDiv.appendChild(scoreBadge); 
        card.appendChild(img);
        card.appendChild(infoDiv);
        
        grid.appendChild(card);
    }
}