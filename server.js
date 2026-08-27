// server.js — Our tiny Node.js server
// It does two things:
// 1. Serves the web page (HTML, CSS, JS)
// 2. Talks to the Brawl Stars API with the secret token

import express from "express"
import dotenv from "dotenv"

// Load the secret token from the .env file
dotenv.config()

const app = express()
const PORT = 3000

// Serve the web page files (index.html, style.css, app.js)
app.use(express.static("."))

// --- Player Tag → our server → Brawl Stars API → JSON → browser ---
app.get("/api/player", async (req, res) => {
  // Read the secret token (never sent to the browser!)
  const token = process.env.BRAWL_STARS_API_TOKEN

  if (!token) {
    return res.status(500).json({ error: "API token is not configured. Check your .env file." })
  }

  // Get the tag from the URL, e.g. /api/player?tag=%232YJGQCYPCJ
  const tag = req.query.tag

  if (!tag) {
    return res.status(400).json({ error: "Please provide a player tag." })
  }

  // Encode the tag for the Brawl Stars API URL ("#" becomes "%23")
  const encodedTag = encodeURIComponent(tag)
  const apiUrl = `https://api.brawlstars.com/v1/players/${encodedTag}`

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 403) {
        return res.status(403).json({
          error: "API key not allowed from this IP address. Check your key at developer.brawlstars.com.",
        })
      }
      if (response.status === 404) {
        return res.status(404).json({
          error: "Player not found! Double-check the tag and try again.",
        })
      }
      return res.status(response.status).json({
        error: errorData.reason || `Brawl Stars API error (${response.status})`,
      })
    }

    // Pick only the fields we need for the player card
    const raw = await response.json()
    const player = {
      name: raw.name,
      tag: raw.tag,
      trophies: raw.trophies,
      highestTrophies: raw.highestTrophies,
      expLevel: raw.expLevel,
      club: raw.club ? { name: raw.club.name } : null,
      brawlers: (raw.brawlers || [])
        .sort((a, b) => b.trophies - a.trophies)
        .map(b => ({
          name: b.name,
          trophies: b.trophies,
          highestTrophies: b.highestTrophies,
          power: b.power,
          rank: b.rank,
        })),
    }

    return res.json(player)

  } catch (err) {
    return res.status(500).json({
      error: "Could not reach the Brawl Stars API. Try again later.",
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
