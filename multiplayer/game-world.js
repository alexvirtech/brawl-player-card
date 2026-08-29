import { ARENA, PLAYER_CFG, BULLET_CFG, GAME_CFG, SPAWN_POINTS } from './game-config.js'
import { validateServerAppearance, validateFigureMode } from './appearance-validation.js'

function pushOut(cx, cy, radius) {
  let x = cx
  let y = cy

  for (const obs of ARENA.obstacles) {
    const nearX = Math.max(obs.x, Math.min(x, obs.x + obs.w))
    const nearY = Math.max(obs.y, Math.min(y, obs.y + obs.h))
    const dx = x - nearX
    const dy = y - nearY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius) {
      if (dist === 0) {
        x = obs.x - radius
      } else {
        const push = radius - dist
        x += (dx / dist) * push
        y += (dy / dist) * push
      }
    }
  }

  x = Math.max(radius + 4, Math.min(ARENA.width - radius - 4, x))
  y = Math.max(radius + 4, Math.min(ARENA.height - radius - 4, y))

  return { x, y }
}

function pointInWall(px, py) {
  for (const obs of ARENA.obstacles) {
    if (px >= obs.x && px <= obs.x + obs.w &&
        py >= obs.y && py <= obs.y + obs.h) {
      return true
    }
  }
  return false
}

export class GameWorld {
  constructor(playerSlots) {
    this.players = new Map()
    this.bullets = []
    this.tick = 0
    this.winningScore = GAME_CFG.winningScore
    this.winner = null
    this.nextBulletId = 1

    for (const slot of playerSlots) {
      const sp = SPAWN_POINTS[slot.colorIndex % SPAWN_POINTS.length]
      this.players.set(slot.playerId, {
        id: slot.playerId,
        nickname: slot.nickname,
        colorIndex: slot.colorIndex,
        figureMode: validateFigureMode(slot.figureMode),
        appearance: validateServerAppearance(slot.appearance),
        x: sp.x,
        y: sp.y,
        health: PLAYER_CFG.health,
        alive: true,
        angle: 0,
        score: 0,
        kills: 0,
        deaths: 0,
        shootTimer: 0,
        respawnTimer: 0,
        input: { dx: 0, dy: 0, angle: 0, shooting: false },
        connected: true,
      })
    }
  }

  setInput(playerId, input) {
    const p = this.players.get(playerId)
    if (!p) return
    p.input = {
      dx: Math.max(-1, Math.min(1, input.dx || 0)),
      dy: Math.max(-1, Math.min(1, input.dy || 0)),
      angle: input.angle || 0,
      shooting: !!input.shooting,
    }
  }

  setConnected(playerId, connected) {
    const p = this.players.get(playerId)
    if (p) p.connected = connected
  }

  update(dt) {
    if (this.winner) return

    this.tick++

    for (const p of this.players.values()) {
      if (!p.alive) {
        p.respawnTimer -= dt * 1000
        if (p.respawnTimer <= 0) {
          this._respawn(p)
        }
        continue
      }

      if (!p.connected) continue

      let dx = p.input.dx
      let dy = p.input.dy
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 1) {
        dx /= len
        dy /= len
      }

      p.x += dx * PLAYER_CFG.speed * dt
      p.y += dy * PLAYER_CFG.speed * dt

      const pos = pushOut(p.x, p.y, PLAYER_CFG.size)
      p.x = pos.x
      p.y = pos.y

      p.angle = p.input.angle

      p.shootTimer -= dt * 1000
      if (p.input.shooting && p.shootTimer <= 0) {
        const bx = p.x + Math.cos(p.angle) * (PLAYER_CFG.size + 8)
        const by = p.y + Math.sin(p.angle) * (PLAYER_CFG.size + 8)
        this.bullets.push({
          id: this.nextBulletId++,
          x: bx,
          y: by,
          vx: Math.cos(p.angle) * BULLET_CFG.speed,
          vy: Math.sin(p.angle) * BULLET_CFG.speed,
          ownerId: p.id,
          colorIndex: p.colorIndex,
          life: BULLET_CFG.lifetime,
        })
        p.shootTimer = PLAYER_CFG.shootCooldown
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt * 1000

      if (b.life <= 0 ||
          b.x < 0 || b.x > ARENA.width ||
          b.y < 0 || b.y > ARENA.height ||
          pointInWall(b.x, b.y)) {
        this.bullets.splice(i, 1)
        continue
      }

      for (const p of this.players.values()) {
        if (!p.alive || p.id === b.ownerId) continue
        const dx = b.x - p.x
        const dy = b.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < PLAYER_CFG.size + BULLET_CFG.size) {
          p.health -= BULLET_CFG.damage
          this.bullets.splice(i, 1)

          if (p.health <= 0) {
            p.health = 0
            p.alive = false
            p.deaths++
            p.respawnTimer = GAME_CFG.respawnDelay

            const shooter = this.players.get(b.ownerId)
            if (shooter) {
              shooter.kills++
              shooter.score++

              if (shooter.score >= this.winningScore) {
                this.winner = shooter.id
              }
            }
          }
          break
        }
      }
    }
  }

  _respawn(p) {
    const sp = SPAWN_POINTS[p.colorIndex % SPAWN_POINTS.length]
    p.x = sp.x
    p.y = sp.y
    p.health = PLAYER_CFG.health
    p.alive = true
    p.shootTimer = 0
  }

  getSnapshot() {
    const players = []
    for (const p of this.players.values()) {
      players.push({
        id: p.id,
        nickname: p.nickname,
        colorIndex: p.colorIndex,
        figureMode: p.figureMode,
        appearance: p.appearance,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        health: p.health,
        alive: p.alive,
        angle: Math.round(p.angle * 100) / 100,
        score: p.score,
        kills: p.kills,
        deaths: p.deaths,
        connected: p.connected,
      })
    }

    const bullets = this.bullets.map(b => ({
      id: b.id,
      x: Math.round(b.x * 10) / 10,
      y: Math.round(b.y * 10) / 10,
      vx: Math.round(b.vx),
      vy: Math.round(b.vy),
      ownerId: b.ownerId,
      colorIndex: b.colorIndex,
    }))

    return { tick: this.tick, players, bullets, winner: this.winner }
  }

  getResults() {
    const sorted = [...this.players.values()]
      .sort((a, b) => b.score - a.score)
    sorted.forEach((p, i) => { p.placement = i + 1 })
    return sorted.map(p => ({
      playerId: p.id,
      nickname: p.nickname,
      colorIndex: p.colorIndex,
      score: p.score,
      kills: p.kills,
      deaths: p.deaths,
      placement: p.placement,
    }))
  }
}
