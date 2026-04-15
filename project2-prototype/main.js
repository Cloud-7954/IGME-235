const API_KEY = "eda4ea3c405d46ac97f0bd43b3afd243";
const BASE_URL = "https://api.rawg.io/api/games";

window.onload = () => {
    document.querySelector("#search-btn").addEventListener("click", handleSearch);
};

function handleSearch() {
    const term = document.querySelector("#search-term").value.trim();

    if (!term) {
        document.querySelector("#status").innerHTML = "Please enter a game name first!";
        return;
    }

    document.querySelector("#status").innerHTML = "Searching API...";

    const searchUrl = `${BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(term)}&page_size=10`;

    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            document.querySelector("#status").innerHTML = `API Success! Found ${data.count} Results`;
            displayResults(data.results);
        })
        .catch(error => {
            document.querySelector("#status").innerHTML = "Error loading data from API.";
        });
}

function displayResults(games) {
    const grid = document.querySelector("#game-grid");
    grid.innerHTML = ""; 

    if (games.length === 0) {
        grid.innerHTML = "<p>No games found.</p>";
        return;
    }

    for (let game of games) {
        const card = document.createElement("div");
        card.className = "game-card";

        const img = document.createElement("img");
        img.src = game.background_image ? game.background_image : "https://via.placeholder.com/400x200?text=No+Cover";
        img.alt = game.name;

        const infoDiv = document.createElement("div");
        infoDiv.className = "info";

        const title = document.createElement("h3");
        title.innerHTML = game.name;

        const dummyGenre = document.createElement("p");
        dummyGenre.innerHTML = "Prototype Card";

        infoDiv.appendChild(title);
        infoDiv.appendChild(dummyGenre);
        card.appendChild(img);
        card.appendChild(infoDiv);
        
        grid.appendChild(card);
    }
}