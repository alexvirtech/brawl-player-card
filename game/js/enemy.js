class Enemy {
  constructor(index) {
    this.index = index
    this.alive = false
    this.x = 0
    this.y = 0
    this.health = 0
    this.maxHealth = 0
    this.angle = Math.PI
    this.shootTimer = 0
    this.hitFlash = 0
    this.wanderAngle = Math.random() * Math.PI * 2
    this.wanderTimer = 0
    this.respawnTimer = 0
    this.spawn()
  }

  spawn() {
    const cfg = GAME_CONFIG.enemy
    const spawnPoints = [
      { x: 860, y: 160 },
      { x: 860, y: 320 },
      { x: 860, y: 480 },
    ]
    const sp = spawnPoints[this.index % spawnPoints.length]
    this.x = sp.x
    this.y = sp.y
    this.health = cfg.health
    this.maxHealth = cfg.health
    this.alive = true
    this.shootTimer = cfg.shootCooldown
    this.hitFlash = 0
    this.wanderAngle = Math.random() * Math.PI * 2
    this.wanderTimer = 0
  }

  update(dt) {
    if (!this.alive) {
      this.respawnTimer -= dt * 1000
      if (this.respawnTimer <= 0) {
        this.spawn()
      }
      return
    }

    const cfg = GAME_CONFIG.enemy
    const dx = Player.x - this.x
    const dy = Player.y - this.y
    const distToPlayer = Math.sqrt(dx * dx + dy * dy)

    this.angle = Math.atan2(dy, dx)

    let moveX = 0
    let moveY = 0

    if (Player.alive && distToPlayer < cfg.chaseRange) {
      if (distToPlayer > cfg.keepDistance) {
        moveX = dx / distToPlayer
        moveY = dy / distToPlayer
      }
    } else {
      this.wanderTimer -= dt * 1000
      if (this.wanderTimer <= 0) {
        this.wanderAngle = Math.random() * Math.PI * 2
        this.wanderTimer = cfg.wanderTime + Math.random() * 1000
      }
      moveX = Math.cos(this.wanderAngle)
      moveY = Math.sin(this.wanderAngle)
    }

    this.x += moveX * cfg.speed * dt
    this.y += moveY * cfg.speed * dt

    const pos = Arena.pushOut(this.x, this.y, cfg.size)
    if (pos.x !== this.x || pos.y !== this.y) {
      this.wanderAngle = Math.random() * Math.PI * 2
      this.wanderTimer = 500
    }
    this.x = pos.x
    this.y = pos.y

    if (Player.alive && distToPlayer < cfg.shootRange) {
      this.shootTimer -= dt * 1000
      if (this.shootTimer <= 0) {
        const bx = this.x + Math.cos(this.angle) * (cfg.size + 8)
        const by = this.y + Math.sin(this.angle) * (cfg.size + 8)
        Bullets.create(bx, by, Math.cos(this.angle), Math.sin(this.angle), false)
        this.shootTimer = cfg.shootCooldown + Math.random() * 400
        Sound.play('shoot')
      }
    }

    if (this.hitFlash > 0) this.hitFlash -= dt * 5
  }

  takeDamage(amount) {
    this.health -= amount
    this.hitFlash = 1
    Sound.play('hit')
    if (this.health <= 0) {
      this.health = 0
      this.alive = false
    }
  }

  startRespawn() {
    this.respawnTimer = GAME_CONFIG.game.respawnDelay
  }

  draw(ctx) {
    if (!this.alive) return

    const cfg = GAME_CONFIG.enemy
    const s = cfg.size

    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : cfg.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = cfg.outlineColor
    ctx.lineWidth = 2
    ctx.stroke()

    this._drawFace(ctx, s)
    this._drawHealthBar(ctx, s)
  }

  _drawFace(ctx, size) {
    const eyeDist = size * 0.35
    const eyeSize = size * 0.28
    const pupilSize = size * 0.14

    const angles = [this.angle - 0.4, this.angle + 0.4]
    angles.forEach((a, i) => {
      const ex = this.x + Math.cos(a) * eyeDist
      const ey = this.y + Math.sin(a) * eyeDist

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2)
      ctx.fill()

      const px = ex + Math.cos(this.angle) * (eyeSize * 0.3)
      const py = ey + Math.sin(this.angle) * (eyeSize * 0.3)
      ctx.fillStyle = '#111111'
      ctx.beginPath()
      ctx.arc(px, py, pupilSize, 0, Math.PI * 2)
      ctx.fill()

      // Angry eyebrow
      const browDir = i === 0 ? 1 : -1
      ctx.strokeStyle = '#cc2233'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ex - eyeSize * 0.8, ey - eyeSize * 0.9 + browDir * 2)
      ctx.lineTo(ex + eyeSize * 0.8, ey - eyeSize * 0.9 - browDir * 2)
      ctx.stroke()
    })
  }

  _drawHealthBar(ctx, size) {
    const w = 40
    const h = 5
    const ratio = this.health / this.maxHealth
    const x = this.x - w / 2
    const y = this.y - size - 12

    ctx.fillStyle = '#333333'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = ratio > 0.5 ? '#44dd44' : ratio > 0.25 ? '#dddd44' : '#dd4444'
    ctx.fillRect(x, y, w * ratio, h)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
  }
}
