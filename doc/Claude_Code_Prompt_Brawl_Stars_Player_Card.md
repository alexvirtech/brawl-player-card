# Claude Code Prompt — Brawl Stars Player Card (Lesson 1)

Build a very small, child-friendly app called **Brawl Stars Player Card**.

## Goal
Create one visible HTML page where a child enters a Brawl Stars Player Tag and sees real profile data from the official Brawl Stars API.

First test tag: `#2YJGQGYPCJ`

## Lesson 1 architecture

```text
Browser: index.html + style.css + app.js
        ↓ GET /api/player?tag=...
Local Node.js server
        ↓ Authorization: Bearer <secret token>
Official Brawl Stars API
        ↓ JSON
Player Card in browser
```

## Critical API/security requirements
- Never put the Brawl Stars API token in `index.html`, `app.js`, or any browser code.
- Read it on the Node.js server from the environment variable `BRAWL_STARS_API_TOKEN`.
- The Brawl Stars developer API key is IP-whitelisted. For Lesson 1, it will be created for the **current public IP address of the home network**.
- If the ISP changes the public IP later, the developer key/IP whitelist may need to be updated or the key recreated.
- **Do not solve production/static-IP deployment in Lesson 1.**
- Do not claim that a standard Vercel serverless function solves the IP whitelist. Normal Vercel serverless egress is not guaranteed to use one fixed outbound IP. A later lesson can add a backend/proxy with static egress IP.

## Keep the project very small

```text
brawl-player-card/
  index.html
  style.css
  app.js
  server.js
  package.json
  .env.example
  .gitignore
  README.md
```

Use Node.js with Express (or an equally tiny Node HTTP server). Use ES modules (`import`/`export`) and no semicolons. No React, Next.js, database, login, TypeScript, or unnecessary libraries.

## Page behavior
1. Title: **Brawl Stars Player Card**.
2. Player Tag input, default `#2YJGQGYPCJ`.
3. Button: **Show my player card**.
4. Browser calls our local endpoint, e.g. `/api/player?tag=%232YJGQGYPCJ`.
5. Server validates and normalizes the tag, URL-encodes it, and calls the official endpoint `https://api.brawlstars.com/v1/players/{encodedTag}`.
6. Server returns only the required JSON to the browser.
7. Display: player name, tag, trophies, highest trophies, EXP level, club name if present, and top 3 brawlers sorted by trophies.
8. Include friendly loading, invalid-tag, API-error, and server-error states.
9. Make it colorful, playful, mobile-first and understandable to an 8–9-year-old child.

## Teaching comments
Add a few short comments showing this flow:

`Player Tag → JavaScript → our server → Brawl Stars API → JSON → Player Card`

Avoid excessive comments and abstractions. The code should be easy to explain line-by-line in a first lesson.

## Local setup
- `npm install`
- `.env` contains `BRAWL_STARS_API_TOKEN=...`
- `.env` must be in `.gitignore`
- `npm start` starts the local server and serves the page
- README must explain how to find the current public IP, create/configure the Brawl Stars API key for that IP, add the token to `.env`, and run the app.

## Success test
Opening the local page and using `#2YJGQGYPCJ` should show Ben's real Brawl Stars player data without exposing the API token to the browser.

## At the end
Show me:
1. project file tree
2. full code for every file
3. exact Windows/VS Code commands to run it locally
4. a simple explanation suitable for an 8-year-old of what happens after clicking the button
5. one small idea for Lesson 2

Do not implement deployment yet.
