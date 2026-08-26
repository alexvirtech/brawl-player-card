// app.js — Runs in the BROWSER (not on the server)

// The proxy server URL — use "" for local dev (same server), or the Heroku URL for production
const API_BASE = window.API_BASE || ""

// Step 1: Find the page elements
const tagInput = document.getElementById("tag-input")
const searchBtn = document.getElementById("search-btn")
const loadingEl = document.getElementById("loading")
const errorEl = document.getElementById("error")
const cardEl = document.getElementById("player-card")

// Step 2: When the button is clicked, ask our server for the player data
searchBtn.addEventListener("click", async () => {
  let tag = tagInput.value.trim().toUpperCase()

  if (!tag) {
    showError("Please enter a player tag!")
    return
  }

  // Add # if the player forgot it
  if (!tag.startsWith("#")) {
    tag = "#" + tag
    tagInput.value = tag
  }

  // Hide old results, show spinner
  cardEl.classList.add("hidden")
  errorEl.classList.add("hidden")
  loadingEl.classList.remove("hidden")

  try {
    // Step 3: Send the tag to OUR server (not directly to Brawl Stars)
    const encodedTag = encodeURIComponent(tag)
    const response = await fetch(`${API_BASE}/api/player?tag=${encodedTag}`)
    const data = await response.json()

    loadingEl.classList.add("hidden")

    if (!response.ok) {
      showError(data.error || "Something went wrong!")
      return
    }

    // Step 4: Show the player card!
    renderCard(data)

  } catch (err) {
    loadingEl.classList.add("hidden")
    showError("Could not connect to the server. Is it running?")
  }
})

// Also search when Enter is pressed
tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click()
})

function showError(message) {
  errorEl.textContent = message
  errorEl.classList.remove("hidden")
}

function renderCard(player) {
  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"]
  const clubName = player.club ? player.club.name : "No club"

  cardEl.innerHTML = `
    <div class="card-header">
      <div class="player-name">${escapeHtml(player.name)}</div>
      <div class="player-tag">${escapeHtml(player.tag)}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-box trophies">
        <div class="stat-value">${player.trophies.toLocaleString()}</div>
        <div class="stat-label">Trophies</div>
      </div>
      <div class="stat-box highest">
        <div class="stat-value">${player.highestTrophies.toLocaleString()}</div>
        <div class="stat-label">Highest</div>
      </div>
      <div class="stat-box level">
        <div class="stat-value">${player.expLevel}</div>
        <div class="stat-label">Level</div>
      </div>
      <div class="stat-box club">
        <div class="stat-value">${escapeHtml(clubName)}</div>
        <div class="stat-label">Club</div>
      </div>
    </div>

    <div class="brawlers-section">
      <h3>Top Brawlers</h3>
      <div class="brawler-list">
        ${player.brawlers.map((b, i) => `
          <div class="brawler-row">
            <span class="brawler-rank">${medals[i]}</span>
            <span class="brawler-name">${escapeHtml(b.name)}</span>
            <span class="brawler-trophies">${b.trophies.toLocaleString()} \u{1F3C6}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `

  cardEl.classList.remove("hidden")
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
