# Brawl Stars Player Card

A simple web app that shows a player card for any Brawl Stars player.
Built as a first coding lesson for kids.

## How it works

```
Player Tag  -->  JavaScript  -->  our server  -->  Brawl Stars API
                                                        |
Player Card  <--  JavaScript  <--  our server  <--  JSON data
```

1. You type a Brawl Stars player tag (like `#2YJGQCYPCJ`)
2. The browser sends it to our local server
3. The server calls the official Brawl Stars API (keeping the secret token hidden)
4. The player card appears with trophies, level, club, and top brawlers

## Setup (Windows / VS Code)

### 1. Get a Brawl Stars API key

1. Go to https://developer.brawlstars.com and create an account
2. Find your public IP address: open https://whatismyipaddress.com and copy the IPv4 address
3. Click **Create New Key**, give it a name, and paste your IP address
4. Copy the long token string

### 2. Set up the project

Open a terminal in VS Code (`Ctrl+`` `) and run:

```
cd D:\Projects\children\Ben\BS-001
npm install
```

### 3. Add your secret token

Create a file called `.env` in the project folder with this content:

```
BRAWL_STARS_API_TOKEN=paste-your-token-here
```

(Replace `paste-your-token-here` with the token from step 1.)

### 4. Run the app

```
npm start
```

Open http://localhost:3000 in your browser and click **Show my player card**.

## Important: IP address

The Brawl Stars API key only works from the IP address you entered when you created it. If your internet provider changes your IP, you will need to go back to https://developer.brawlstars.com and update the key or create a new one.

## Files

| File | What it does |
|------|-------------|
| `index.html` | The web page |
| `style.css` | Colors and layout |
| `app.js` | Browser code: sends the tag, shows the card |
| `server.js` | Server code: talks to Brawl Stars API secretly |
| `.env` | Your secret API token (never share this!) |

## Lesson 2 idea

Add brawler icons next to the top 3 brawlers to make the card more visual.
