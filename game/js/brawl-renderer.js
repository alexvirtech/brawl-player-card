const BRAWL_CHARACTERS = {
  sirius: {
    id: 'sirius',
    label: 'Sirius',
    bodyColor: '#2a1a4a',
    bodyAccent: '#6633cc',
    skinColor: '#e8c090',
    eyeColor: '#ffcc00',
    hairColor: '#ffd700',
    outfitColor: '#4422aa',
    accentColor: '#ffd700',
    capeColor: '#3311aa',
  },
  kenji: {
    id: 'kenji',
    label: 'Kenji',
    bodyColor: '#8b0000',
    bodyAccent: '#cc2222',
    skinColor: '#f0d0a0',
    eyeColor: '#333333',
    hairColor: '#1a1a2e',
    outfitColor: '#aa1111',
    accentColor: '#ccaa44',
    armorColor: '#555566',
  },
  nori: {
    id: 'nori',
    label: 'Nori',
    bodyColor: '#1a6644',
    bodyAccent: '#22aa66',
    skinColor: '#f5c5a3',
    eyeColor: '#44aaff',
    hairColor: '#222233',
    outfitColor: '#118844',
    accentColor: '#ff6688',
    bandColor: '#ff4466',
  },
}

const BrawlRenderer = {
  drawCharacter(ctx, x, y, size, angle, charId, state) {
    const ch = BRAWL_CHARACTERS[charId] || BRAWL_CHARACTERS.sirius
    const anim = state || {}
    const bounce = anim.walking ? Math.sin((anim.time || 0) * 12) * 2 : 0
    const breathe = Math.sin((anim.time || 0) * 2.5) * 0.5
    const isDead = anim.dead
    const isHit = anim.hitFlash > 0

    if (isDead) {
      ctx.save()
      ctx.globalAlpha = 0.5
    }

    switch (charId) {
      case 'kenji': this._drawKenji(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim); break
      case 'nori': this._drawNori(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim); break
      default: this._drawSirius(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim)
    }

    if (isDead) ctx.restore()
  },

  _drawSirius(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.7, s * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(x, y + bounce * 0.3)
    const capeWave = Math.sin((anim.time || 0) * 3) * 3
    ctx.fillStyle = ch.capeColor
    ctx.beginPath()
    ctx.moveTo(-s * 0.3, -s * 0.1)
    ctx.quadraticCurveTo(-s * 0.5 + capeWave, s * 0.4, -s * 0.2, s * 0.8)
    ctx.lineTo(s * 0.2, s * 0.8)
    ctx.quadraticCurveTo(s * 0.5 - capeWave, s * 0.4, s * 0.3, -s * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd70044'
    ctx.beginPath()
    ctx.moveTo(-s * 0.15, s * 0.1)
    ctx.lineTo(0, s * 0.6)
    ctx.lineTo(s * 0.15, s * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    const legStep = anim.walking ? Math.sin((anim.time || 0) * 14) * 3 : 0
    ctx.fillStyle = ch.bodyColor
    ctx.fillRect(x - s * 0.2, y + s * 0.35 + bounce, s * 0.12, s * 0.35 - legStep)
    ctx.fillRect(x + s * 0.08, y + s * 0.35 + bounce, s * 0.12, s * 0.35 + legStep)
    ctx.fillStyle = '#2a1a3a'
    ctx.fillRect(x - s * 0.22, y + s * 0.65 + bounce - legStep, s * 0.16, s * 0.1)
    ctx.fillRect(x + s * 0.06, y + s * 0.65 + bounce + legStep, s * 0.16, s * 0.1)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.35, y - s * 0.2, x + s * 0.35, y + s * 0.4)
    bodyGrad.addColorStop(0, ch.bodyAccent)
    bodyGrad.addColorStop(0.5, ch.outfitColor)
    bodyGrad.addColorStop(1, ch.bodyColor)
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.38, s * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.accentColor
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.15 + bounce)
    ctx.lineTo(x - s * 0.08, y + s * 0.1 + bounce)
    ctx.lineTo(x + s * 0.08, y + s * 0.1 + bounce)
    ctx.closePath()
    ctx.fill()

    const headY = y - s * 0.45 + bounce + breathe
    const headGrad = ctx.createRadialGradient(x - s * 0.1, headY - s * 0.1, s * 0.02, x, headY, s * 0.32)
    headGrad.addColorStop(0, '#ffe8cc')
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.hairColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.1, s * 0.32, Math.PI * 1.1, Math.PI * 1.9)
    ctx.lineTo(x + s * 0.35, headY - s * 0.2)
    ctx.quadraticCurveTo(x + s * 0.1, headY - s * 0.45, x - s * 0.15, headY - s * 0.35)
    ctx.closePath()
    ctx.fill()

    for (let i = 0; i < 3; i++) {
      const sx = x - s * 0.1 + i * s * 0.1
      ctx.fillStyle = ch.hairColor
      ctx.beginPath()
      ctx.moveTo(sx - s * 0.04, headY - s * 0.3)
      ctx.lineTo(sx, headY - s * 0.55 - i * s * 0.05)
      ctx.lineTo(sx + s * 0.04, headY - s * 0.3)
      ctx.closePath()
      ctx.fill()
    }

    ctx.save()
    ctx.shadowColor = ch.accentColor
    ctx.shadowBlur = 6
    ctx.fillStyle = ch.accentColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.42, s * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const eyeDist = s * 0.12
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.02
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.09, s * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ch.eyeColor
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.03, ey + Math.sin(angle) * s * 0.03, s * 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.04, ey + Math.sin(angle) * s * 0.04, s * 0.025, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = '#2a1a3a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, headY + s * 0.14, s * 0.06, 0.2, Math.PI - 0.2)
    ctx.stroke()

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.35, y + Math.sin(angle) * s * 0.1 + bounce)
    ctx.rotate(angle)
    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6633cc'
    ctx.fillRect(s * 0.05, -s * 0.04, s * 0.35, s * 0.08)
    ctx.save()
    ctx.shadowColor = '#ffcc00'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(s * 0.4, 0, s * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.restore()
  },

  _drawKenji(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.7, s * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    const legStep = anim.walking ? Math.sin((anim.time || 0) * 14) * 3 : 0
    ctx.fillStyle = '#333344'
    ctx.fillRect(x - s * 0.2, y + s * 0.35 + bounce, s * 0.14, s * 0.35 - legStep)
    ctx.fillRect(x + s * 0.06, y + s * 0.35 + bounce, s * 0.14, s * 0.35 + legStep)
    ctx.fillStyle = '#222233'
    ctx.fillRect(x - s * 0.22, y + s * 0.65 + bounce - legStep, s * 0.18, s * 0.1)
    ctx.fillRect(x + s * 0.04, y + s * 0.65 + bounce + legStep, s * 0.18, s * 0.1)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.4, y - s * 0.2, x + s * 0.4, y + s * 0.4)
    bodyGrad.addColorStop(0, ch.bodyAccent)
    bodyGrad.addColorStop(0.5, ch.bodyColor)
    bodyGrad.addColorStop(1, '#550000')
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.4, s * 0.38, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.armorColor
    ctx.beginPath()
    ctx.moveTo(x - s * 0.35, y - s * 0.1 + bounce)
    ctx.lineTo(x - s * 0.45, y + bounce)
    ctx.lineTo(x - s * 0.35, y + s * 0.1 + bounce)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.35, y - s * 0.1 + bounce)
    ctx.lineTo(x + s * 0.45, y + bounce)
    ctx.lineTo(x + s * 0.35, y + s * 0.1 + bounce)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.accentColor
    ctx.fillRect(x - s * 0.2, y - s * 0.18 + bounce, s * 0.4, s * 0.06)
    ctx.strokeStyle = ch.accentColor + '88'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.18 + bounce)
    ctx.lineTo(x, y + s * 0.25 + bounce)
    ctx.stroke()

    const headY = y - s * 0.48 + bounce + breathe
    const headGrad = ctx.createRadialGradient(x - s * 0.08, headY - s * 0.08, s * 0.02, x, headY, s * 0.3)
    headGrad.addColorStop(0, '#ffe8cc')
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.armorColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.05, s * 0.32, Math.PI * 1.15, Math.PI * 1.85)
    ctx.lineTo(x + s * 0.3, headY - s * 0.15)
    ctx.quadraticCurveTo(x, headY - s * 0.5, x - s * 0.3, headY - s * 0.15)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#333344'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = ch.accentColor
    ctx.beginPath()
    ctx.moveTo(x - s * 0.05, headY - s * 0.35)
    ctx.lineTo(x, headY - s * 0.5)
    ctx.lineTo(x + s * 0.05, headY - s * 0.35)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#cc2222'
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.05, s * 0.3, Math.PI * 1.2, Math.PI * 1.8, true)
    ctx.closePath()
    ctx.fill()

    const eyeDist = s * 0.1
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.04
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.07, s * 0.06, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ch.eyeColor
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.025, ey + Math.sin(angle) * s * 0.025, s * 0.04, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#550000'
      ctx.lineWidth = 2
      ctx.beginPath()
      const bx = ex - side * s * 0.06
      ctx.moveTo(bx, ey - s * 0.1)
      ctx.lineTo(ex + side * s * 0.08, ey - s * 0.06)
      ctx.stroke()
    }

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - s * 0.04, headY + s * 0.15)
    ctx.lineTo(x + s * 0.04, headY + s * 0.15)
    ctx.stroke()

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.3, y + Math.sin(angle) * s * 0.05 + bounce)
    ctx.rotate(angle)
    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#aaaacc'
    ctx.fillRect(s * 0.08, -s * 0.025, s * 0.55, s * 0.05)
    ctx.fillStyle = '#ccccdd'
    ctx.fillRect(s * 0.55, -s * 0.04, s * 0.08, s * 0.08)
    ctx.fillStyle = '#666677'
    ctx.fillRect(s * 0.05, -s * 0.04, s * 0.08, s * 0.08)
    ctx.restore()
  },

  _drawNori(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.7, s * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    const legStep = anim.walking ? Math.sin((anim.time || 0) * 14) * 3 : 0
    ctx.fillStyle = '#224433'
    ctx.fillRect(x - s * 0.18, y + s * 0.35 + bounce, s * 0.12, s * 0.32 - legStep)
    ctx.fillRect(x + s * 0.06, y + s * 0.35 + bounce, s * 0.12, s * 0.32 + legStep)
    ctx.fillStyle = '#1a3322'
    ctx.fillRect(x - s * 0.2, y + s * 0.62 + bounce - legStep, s * 0.16, s * 0.1)
    ctx.fillRect(x + s * 0.04, y + s * 0.62 + bounce + legStep, s * 0.16, s * 0.1)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.35, y - s * 0.2, x + s * 0.35, y + s * 0.4)
    bodyGrad.addColorStop(0, ch.bodyAccent)
    bodyGrad.addColorStop(0.5, ch.outfitColor)
    bodyGrad.addColorStop(1, ch.bodyColor)
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.36, s * 0.33, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.bandColor
    ctx.save()
    ctx.translate(x, y + bounce)
    ctx.rotate(0.3)
    ctx.fillRect(-s * 0.35, -s * 0.04, s * 0.7, s * 0.07)
    ctx.restore()

    ctx.fillStyle = ch.accentColor
    ctx.beginPath()
    ctx.arc(x + s * 0.15, y - s * 0.05 + bounce, s * 0.05, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#cc3355'
    ctx.lineWidth = 1
    ctx.stroke()

    const headY = y - s * 0.43 + bounce + breathe
    const headGrad = ctx.createRadialGradient(x - s * 0.08, headY - s * 0.08, s * 0.02, x, headY, s * 0.3)
    headGrad.addColorStop(0, '#ffe8cc')
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = ch.hairColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.06, s * 0.3, Math.PI * 1.05, Math.PI * 1.95)
    ctx.lineTo(x + s * 0.28, headY - s * 0.1)
    ctx.quadraticCurveTo(x, headY - s * 0.45, x - s * 0.28, headY - s * 0.1)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.hairColor
    ctx.beginPath()
    ctx.moveTo(x - s * 0.1, headY + s * 0.1)
    ctx.quadraticCurveTo(x - s * 0.35, headY + s * 0.3, x - s * 0.15, headY + s * 0.5)
    ctx.lineTo(x - s * 0.05, headY + s * 0.35)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.1, headY + s * 0.1)
    ctx.quadraticCurveTo(x + s * 0.35, headY + s * 0.3, x + s * 0.15, headY + s * 0.5)
    ctx.lineTo(x + s * 0.05, headY + s * 0.35)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.bandColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.05, s * 0.31, Math.PI * 1.15, Math.PI * 1.85)
    ctx.lineTo(x + s * 0.25, headY - s * 0.12)
    ctx.lineTo(x + s * 0.25, headY - s * 0.06)
    ctx.arc(x, headY - s * 0.05, s * 0.25, Math.PI * 1.85, Math.PI * 1.15, true)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.bandColor
    ctx.save()
    ctx.translate(x + s * 0.25, headY - s * 0.1)
    ctx.rotate(0.4)
    ctx.fillRect(0, -s * 0.03, s * 0.25, s * 0.06)
    ctx.fillRect(0, s * 0.02, s * 0.2, s * 0.05)
    ctx.restore()

    const eyeDist = s * 0.1
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.04
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.08, s * 0.07, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ch.eyeColor
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.03, ey + Math.sin(angle) * s * 0.03, s * 0.045, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.035, ey + Math.sin(angle) * s * 0.035, s * 0.02, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = '#2a1a1a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, headY + s * 0.14, s * 0.05, 0.3, Math.PI - 0.3)
    ctx.stroke()

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.3, y + Math.sin(angle) * s * 0.05 + bounce)
    ctx.rotate(angle)
    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.09, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#66aa88'
    ctx.beginPath()
    ctx.moveTo(s * 0.08, -s * 0.02)
    ctx.lineTo(s * 0.45, -s * 0.01)
    ctx.lineTo(s * 0.45, s * 0.01)
    ctx.lineTo(s * 0.08, s * 0.02)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#88ccaa'
    ctx.beginPath()
    ctx.moveTo(s * 0.45, 0)
    ctx.lineTo(s * 0.35, -s * 0.06)
    ctx.lineTo(s * 0.55, 0)
    ctx.lineTo(s * 0.35, s * 0.06)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  },

  drawHealthBar(ctx, cx, cy, health, maxHealth) {
    const w = 56
    const h = 7
    const ratio = health / maxHealth
    const x = cx - w / 2

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(x - 1, cy - 1, w + 2, h + 2)
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(x, cy, w, h)

    if (ratio > 0) {
      const hGrad = ctx.createLinearGradient(x, cy, x, cy + h)
      if (ratio > 0.5) {
        hGrad.addColorStop(0, '#66ff66')
        hGrad.addColorStop(1, '#33bb33')
      } else if (ratio > 0.25) {
        hGrad.addColorStop(0, '#ffff44')
        hGrad.addColorStop(1, '#ccaa22')
      } else {
        hGrad.addColorStop(0, '#ff5555')
        hGrad.addColorStop(1, '#cc2222')
      }
      ctx.fillStyle = hGrad
      ctx.fillRect(x, cy, w * ratio, h)
    }

    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x, cy, w, h)
  },
}
