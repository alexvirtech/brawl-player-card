const Effects = {
  list: [],

  create(x, y, color) {
    this.list.push({ x, y, color, radius: 4, alpha: 1 })
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i]
      e.radius += dt * 80
      e.alpha -= dt * 4
      if (e.alpha <= 0) this.list.splice(i, 1)
    }
  },

  draw(ctx) {
    this.list.forEach(e => {
      ctx.globalAlpha = Math.max(0, e.alpha)
      ctx.strokeStyle = e.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    })
  },
}

const Bullets = {
  list: [],

  clear() {
    this.list = []
    Effects.list = []
  },

  create(x, y, dirX, dirY, isPlayer) {
    const cfg = GAME_CONFIG.bullet
    const len = Math.sqrt(dirX * dirX + dirY * dirY)
    if (len === 0) return

    this.list.push({
      x,
      y,
      vx: (dirX / len) * cfg.speed,
      vy: (dirY / len) * cfg.speed,
      size: cfg.size,
      damage: isPlayer ? cfg.playerDamage : cfg.enemyDamage,
      color: isPlayer ? cfg.playerColor : cfg.enemyColor,
      isPlayer,
      life: cfg.lifetime,
    })
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt * 1000

      if (
        b.life <= 0 ||
        b.x < 0 || b.x > Arena.width ||
        b.y < 0 || b.y > Arena.height ||
        Arena.pointInWall(b.x, b.y)
      ) {
        if (Arena.pointInWall(b.x, b.y)) {
          Effects.create(b.x, b.y, '#aaaaaa')
        }
        this.list.splice(i, 1)
      }
    }

    Effects.update(dt)
  },

  draw(ctx) {
    this.list.forEach(b => {
      ctx.fillStyle = b.color + '44'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2)
      ctx.fill()
    })

    Effects.draw(ctx)
  },
}
