# Deploying BEN BATTLE Multiplayer Server to Heroku

## 1. Create the Heroku app

```bash
heroku create ben-battle-mp --remote heroku-mp
```

## 2. Add Heroku Postgres

```bash
heroku addons:create heroku-postgresql:essential-0 --app ben-battle-mp
```

## 3. Set environment variables

```bash
heroku config:set CORS_ORIGIN="https://www.benmaorgal.com,https://benmaorgal.com" --app ben-battle-mp
```

The `DATABASE_URL` is automatically set by the Postgres add-on.

## 4. Deploy

From the project root:

```bash
git subtree push --prefix multiplayer heroku-mp master
```

## 5. Run database migration

```bash
heroku run npx prisma db push --app ben-battle-mp
```

## 6. Verify

```bash
curl https://ben-battle-mp.herokuapp.com/health
```

Should return: `{"ok": true}`

## Update the frontend server URL

After creating the Heroku app, update the `MP_SERVER` constant in:
- `game/js/mp-client.js`
- `player/index.html`

Replace the placeholder URL with the actual Heroku app URL.

## WebSocket support

Heroku supports WebSocket connections natively. Socket.IO will use
WebSocket transport with HTTP long-polling as fallback.

## Scaling

For production with more concurrent games, consider:
- Upgrading the Postgres plan
- Adding multiple dynos with Redis adapter for Socket.IO
