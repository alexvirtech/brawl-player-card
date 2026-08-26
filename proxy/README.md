# Brawl Stars Proxy Server (Heroku)

A tiny proxy server that calls the Brawl Stars API through a fixed IP address.
The Brawl Stars API requires IP whitelisting, so this proxy uses Heroku + Fixie add-on
to provide a static outbound IP.

## Architecture

```
Browser (Vercel)  -->  This Proxy (Heroku + Fixie)  -->  Brawl Stars API
                       fixed IP: x.x.x.x
```

## Deploy to Heroku

### 1. Install Heroku CLI

Download from https://devcenter.heroku.com/articles/heroku-cli

### 2. Create the Heroku app

```bash
cd proxy
git init
heroku create brawl-stars-proxy
```

### 3. Add Fixie for a static IP

```bash
heroku addons:create fixie:tricycle
```

This gives you a fixed outbound IP. Find it with:

```bash
heroku addons:open fixie
```

Copy the IP address shown on the Fixie dashboard.

### 4. Create a new Brawl Stars API key

1. Go to https://developer.brawlstars.com
2. Create a new API key using the **Fixie IP address** (not your home IP)
3. Copy the token

### 5. Set environment variables

```bash
heroku config:set BRAWL_STARS_API_TOKEN=your-new-token-here
heroku config:set ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 6. Deploy

```bash
git add .
git commit -m "Initial proxy server"
git push heroku main
```

### 7. Test it

```bash
curl https://brawl-stars-proxy.herokuapp.com/api/player?tag=%232YJGQCYPCJ
```

## Update the Vercel frontend

After deploying, set the Heroku URL in Vercel:

1. Go to your Vercel project settings
2. Add environment variable: `VITE_PROXY_URL=https://brawl-stars-proxy.herokuapp.com`
3. Or hardcode the URL in `app.js` if this is just a learning project

## Local development

```bash
npm install
cp .env.example .env
# Edit .env with your token and allowed origins
npm start
```
