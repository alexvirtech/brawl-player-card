// api.js — Talks to our proxy server to get Brawl Stars data
// The API token stays secret on the server — we never see it here!

// Our proxy server URL (on Heroku with a fixed IP)
const API_BASE = "https://brawl-stars-proxy-eae7df075ba4.herokuapp.com"

// Fetch a player's data from the Brawl Stars API (through our proxy)
async function fetchPlayer(tag) {
  // Make sure the tag starts with #
  if (!tag.startsWith("#")) {
    tag = "#" + tag
  }

  // Encode the tag so "#" becomes "%23" in the URL
  const encodedTag = encodeURIComponent(tag)

  // Ask our proxy server for the player data
  const response = await fetch(`${API_BASE}/api/player?tag=${encodedTag}`)
  const data = await response.json()

  // If there was an error, throw it so the page can show a message
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong!")
  }

  return data
}
