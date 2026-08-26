// Heroku proxy server with a fixed outbound IP
// Browser (Vercel) → this proxy → Brawl Stars API

import "dotenv/config"
import express from "express"
import cors from "cors"
import { ProxyAgent, fetch as proxyFetch } from "undici"

const app = express()
const PORT = process.env.PORT || 3001

// Only allow requests from our domain and its subdomains
const allowedDomain = process.env.ALLOWED_DOMAIN || ""

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (!allowedDomain) return true
  try {
    const hostname = new URL(origin).hostname
    return hostname === allowedDomain || hostname.endsWith("." + allowedDomain)
  } catch {
    return false
  }
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }
    callback(new Error("Not allowed"))
  },
}))

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "brawl-stars-proxy" })
})

// Proxy endpoint
app.get("/api/player", async (req, res) => {
  const token = process.env.BRAWL_STARS_API_TOKEN

  if (!token) {
    return res.status(500).json({ error: "API token is not configured." })
  }

  const tag = req.query.tag

  if (!tag) {
    return res.status(400).json({ error: "Please provide a player tag." })
  }

  const encodedTag = encodeURIComponent(tag)
  const apiUrl = `https://api.brawlstars.com/v1/players/${encodedTag}`

  // Route through Fixie's static IP proxy if available
  const fetchOptions = {
    headers: { Authorization: `Bearer ${token}` },
  }

  if (process.env.FIXIE_URL) {
    fetchOptions.dispatcher = new ProxyAgent(process.env.FIXIE_URL)
  }

  try {
    const response = await proxyFetch(apiUrl, fetchOptions)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 403) {
        return res.status(403).json({
          error: "API key not allowed from this IP. Update it at developer.brawlstars.com.",
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
        .slice(0, 3)
        .map(b => ({ name: b.name, trophies: b.trophies })),
    }

    return res.json(player)

  } catch (err) {
    console.error("Proxy error:", err.message)
    return res.status(500).json({
      error: "Could not reach the Brawl Stars API. Try again later.",
    })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`)
})
