# BEN BATTLE Multiplayer Plan

## Current Architecture

Single-player top-down arena game:
- **Frontend**: Static HTML/CSS/JS on Vercel (`benmaorgal.com`)
- **Game**: HTML5 Canvas, 960x640, `requestAnimationFrame` loop
- **Modules**: `config.js`, `input.js`, `arena.js`, `bullet.js`, `player.js`, `enemy.js`, `ui.js`, `game.js`
- **Controls**: Keyboard+mouse (desktop), virtual joystick+tap (mobile)
- **Logic**: Client-side only, 3 AI enemies, first to 5 kills wins

## Multiplayer Architecture

```
Browser (Vercel)          Multiplayer Server (Heroku)
  lobby.html  ──REST──▶  Express API (players, games)
  lobby.html  ──WS────▶  Socket.IO (lobby events)
  lobby.html  ──WS────▶  Socket.IO (game state @ 20Hz)
                          Prisma ──▶ PostgreSQL (Heroku)
```

### Server-Authoritative Model
- Server runs game simulation at 20 ticks/sec (50ms)
- Clients send input (move direction, aim angle, shooting flag)
- Server processes physics, collisions, scoring
- Server broadcasts state snapshots to all players
- Client interpolates between snapshots for smooth rendering

### Player Identity
- Nickname + random token (no email/password — child-friendly)
- Token hashed (SHA-256) in DB, raw token stored in localStorage
- All API/socket requests authenticated via token

### Game Rooms
- Host creates game, gets 6-digit code
- Other players join via code or shareable URL (`/game/CODE`)
- Host approves/rejects join requests
- 2-5 players per game
- Solo mode preserved (no server needed)

## Database Model (Prisma/PostgreSQL)

```
Player: id, nickname, tokenHash, createdAt, lastSeenAt
Game: id, publicCode, hostId, status(waiting/countdown/playing/finished/cancelled), createdAt, startedAt, endedAt, winnerId
GamePlayer: id, gameId, playerId, color, score, kills, deaths, placement
JoinRequest: id, gameId, playerId, status(pending/accepted/rejected), createdAt
```

## State Flow

1. Player visits `/game/` → sees PLAY SOLO / PLAY WITH FRIENDS
2. PLAY WITH FRIENDS → `/game/lobby.html`
3. First visit → enter nickname → POST /api/players → save token
4. CREATE GAME → POST /api/games → get 6-digit code → socket joins lobby room
5. Share link `/game/CODE` or tell friends the code
6. Friend enters code → POST /api/games/:code/join → join request created
7. Host sees request via socket → approves → player added to lobby
8. Host clicks START → 3-second countdown → game begins
9. Server runs simulation, broadcasts snapshots at 20Hz
10. First to 5 kills → game over → results persisted → results screen
11. Players can view profile/stats at `/player/`

## Key Refactors

- Arena obstacles extracted to shared config (used by both server sim and client render)
- Spawn points expanded to 5 positions for up to 5 players
- Player colors assigned by slot index (blue, red, green, orange, purple)
- Solo game preserved unchanged at `/game/` with PLAY SOLO button

## File Structure

```
multiplayer/               # Heroku app
  package.json
  Procfile
  prisma/schema.prisma
  server.js                # Entry: Express + Socket.IO
  game-config.js           # Shared constants + obstacles
  game-world.js            # Server-authoritative simulation
  rooms.js                 # GameRoom class + room manager
  routes.js                # REST API routes
  auth.js                  # Token auth middleware

game/                      # Updated frontend
  index.html               # Updated: PLAY SOLO / PLAY WITH FRIENDS
  lobby.html               # Multiplayer lobby (rewritten via /game/CODE)
  js/mp-client.js          # Socket.IO multiplayer client
  js/mp-renderer.js        # Multi-player canvas renderer

player/index.html          # Player profile + stats
vercel.json                # Rewrites for /game/:code
```
