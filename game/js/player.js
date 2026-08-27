const Player = {
  x: 0,
  y: 0,
  health: 0,
  maxHealth: 0,
  alive: true,
  shootTimer: 0,
  angle: 0,
  hitFlash: 0,

  spawn() {
    const cfg = GAME_CONFIG.player
    this.x = 100
    this.y = Arena.height / 2
    this.health = cfg.health
    this.maxHealth = cfg.health
    this.alive = true
    this.shootTimer = 0
    this.hitFlash = 0
  },

  update(dt) {
    if (!this.alive) return

    const cfg = GAME_CONFIG.player
    let dx = 0
    let dy = 0

    if (Input.isDown('w') || Input.isDown('arrowup')) dy -= 1
    if (Input.isDown('s') || Input.isDown('arrowdown')) dy += 1
    if (Input.isDown('a') || Input.isDown('arrowleft')) dx -= 1
    if (Input.isDown('d') || Input.isDown('arrowright')) dx += 1

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy)
      dx /= len
      dy /= len
    }

    if (Input.touch.moveId !== null) {
      dx = Input.touch.moveDx
      dy = Input.touch.moveDy
    }

    this.x += dx * cfg.speed * dt
    this.y += dy * cfg.speed * dt

    const pos = Arena.pushOut(this.x, this.y, cfg.size)
    this.x = pos.x
    this.y = pos.y

    if (Input.touch.shooting) {
      this.angle = Math.atan2(Input.touch.shootY - this.y, Input.touch.shootX - this.x)
    } else {
      this.angle = Math.atan2(Input.mouse.y - this.y, Input.mouse.x - this.x)
    }

    this.shootTimer -= dt * 1000
    const shooting = Input.mouse.down || Input.isDown(' ') || Input.touch.shooting
    if (shooting && this.shootTimer <= 0) {
      const bx = this.x + Math.cos(this.angle) * (cfg.size + 8)
      const by = this.y + Math.sin(this.angle) * (cfg.size + 8)
      Bullets.create(bx, by, Math.cos(this.angle), Math.sin(this.angle), true)
      this.shootTimer = cfg.shootCooldown
      Sound.play('shoot')
    }

    if (this.hitFlash > 0) this.hitFlash -= dt * 5
  },

  takeDamage(amount) {
    this.health -= amount
    this.hitFlash = 1
    Sound.play('hit')
    if (this.health <= 0) {
      this.health = 0
      this.alive = false
    }
  },

  draw(ctx) {
    if (!this.alive) return

    const cfg = GAME_CONFIG.player
    const s = cfg.size

    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : cfg.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = cfg.outlineColor
    ctx.lineWidth = 2
    ctx.stroke()

    this._drawFace(ctx, this.x, this.y, s, this.angle)
    this._drawHealthBar(ctx, this.x, this.y - s - 12)
  },

  _drawFace(ctx, x, y, size, angle) {
    const eyeDist = size * 0.35
    const eyeSize = size * 0.28
    const pupilSize = size * 0.14

    const angles = [angle - 0.4, angle + 0.4]
    angles.forEach(a => {
      const ex = x + Math.cos(a) * eyeDist
      const ey = y + Math.sin(a) * eyeDist
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2)
      ctx.fill()

      const px = ex + Math.cos(angle) * (eyeSize * 0.3)
      const py = ey + Math.sin(angle) * (eyeSize * 0.3)
      ctx.fillStyle = '#111111'
      ctx.beginPath()
      ctx.arc(px, py, pupilSize, 0, Math.PI * 2)
      ctx.fill()
    })
  },

  _drawHealthBar(ctx, cx, cy) {
    const w = 40
    const h = 5
    const ratio = this.health / this.maxHealth
    const x = cx - w / 2

    ctx.fillStyle = '#333333'
    ctx.fillRect(x, cy, w, h)
    ctx.fillStyle = ratio > 0.5 ? '#44dd44' : ratio > 0.25 ? '#dddd44' : '#dd4444'
    ctx.fillRect(x, cy, w * ratio, h)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1
    ctx.strokeRect(x, cy, w, h)
  },
}
