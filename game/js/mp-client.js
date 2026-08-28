const MP_SERVER = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://ben-battle-mp-b0c1a7d8f35e.herokuapp.com'

const PLAYER_COLORS = [
  { fill: '#4488ff', outline: '#2266cc', bullet: '#44ddff', name: 'Blue' },
  { fill: '#ff4455', outline: '#cc2233', bullet: '#ff8844', name: 'Red' },
  { fill: '#44dd44', outline: '#22aa22', bullet: '#88ff88', name: 'Green' },
  { fill: '#ff8844', outline: '#cc6622', bullet: '#ffaa66', name: 'Orange' },
  { fill: '#aa55ff', outline: '#7733cc', bullet: '#cc88ff', name: 'Purple' },
]

const ARENA_OBSTACLES = [
  { x: 150, y: 130, w: 120, h: 20, type: 'wall' },
  { x: 690, y: 130, w: 120, h: 20, type: 'wall' },
  { x: 370, y: 230, w: 220, h: 20, type: 'wall' },
  { x: 370, y: 390, w: 220, h: 20, type: 'wall' },
  { x: 150, y: 490, w: 120, h: 20, type: 'wall' },
  { x: 690, y: 490, w: 120, h: 20, type: 'wall' },
  { x: 380, y: 290, w: 44, h: 44, type: 'box' },
  { x: 536, y: 290, w: 44, h: 44, type: 'box' },
]

let mp = {
  token: localStorage.getItem('mp-token'),
  playerId: localStorage.getItem('mp-player-id'),
  nickname: localStorage.getItem('mp-nickname'),
  socket: null,
  gameCode: null,
  isHost: false,
  pendingRequests: [],
  players: [],
  snapshot: null,
  prevSnapshot: null,
  myId: null,
  canvas: null,
  ctx: null,
  inputState: { dx: 0, dy: 0, angle: 0, shooting: false },
  keys: {},
  mouse: { x: 480, y: 320, down: false },
  touch: { moveId: null, moveStartX: 0, moveStartY: 0, moveDx: 0, moveDy: 0, shootId: null, shootX: 0, shootY: 0, shooting: false },
  joystick: { visible: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 },
  animFrame: null,
  soundCtx: null,
  soundEnabled: true,
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById('screen-' + id).classList.add('active')
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (mp.token) headers['Authorization'] = 'Bearer ' + mp.token
  const res = await fetch(MP_SERVER + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function checkCodeInUrl() {
  const path = window.location.pathname
  const match = path.match(/\/game\/(\d{6})$/)
  if (match) return match[1]
  const params = new URLSearchParams(window.location.search)
  return params.get('code')
}

function init() {
  const codeFromUrl = checkCodeInUrl()

  if (!mp.token) {
    showScreen('nickname')
    setupNicknameScreen(codeFromUrl)
    return
  }

  mp.myId = mp.playerId

  if (codeFromUrl) {
    joinByCode(codeFromUrl)
  } else {
    showScreen('menu')
    setupMenuScreen()
  }
}

function setupNicknameScreen(codeAfter) {
  const input = document.getElementById('nickname-input')
  const btn = document.getElementById('nickname-btn')
  const err = document.getElementById('nickname-error')

  input.focus()

  async function submit() {
    const name = input.value.trim()
    if (!name) {
      err.textContent = 'Enter a name!'
      err.style.display = 'block'
      return
    }

    btn.disabled = true
    btn.textContent = 'Creating...'
    err.style.display = 'none'

    try {
      const data = await apiFetch('/api/players', {
        method: 'POST',
        body: JSON.stringify({ nickname: name }),
      })
      mp.token = data.token
      mp.playerId = data.id
      mp.nickname = data.nickname
      mp.myId = data.id
      localStorage.setItem('mp-token', data.token)
      localStorage.setItem('mp-player-id', data.id)
      localStorage.setItem('mp-nickname', data.nickname)

      if (codeAfter) {
        joinByCode(codeAfter)
      } else {
        showScreen('menu')
        setupMenuScreen()
      }
    } catch (e) {
      err.textContent = e.message
      err.style.display = 'block'
      btn.disabled = false
      btn.textContent = "LET'S GO!"
    }
  }

  btn.onclick = submit
  input.onkeydown = (e) => { if (e.key === 'Enter') submit() }
}

function setupMenuScreen() {
  document.getElementById('menu-nickname').textContent = mp.nickname

  document.getElementById('create-btn').onclick = createGame
  document.getElementById('join-btn').onclick = () => {
    const code = document.getElementById('join-code-input').value.trim()
    if (code.length === 6) joinByCode(code)
  }

  document.getElementById('join-code-input').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('join-btn').click()
  }
}

async function createGame() {
  const btn = document.getElementById('create-btn')
  const err = document.getElementById('menu-error')
  btn.disabled = true
  btn.textContent = 'Creating...'
  err.style.display = 'none'

  try {
    const data = await apiFetch('/api/games', { method: 'POST' })
    mp.gameCode = data.publicCode
    mp.isHost = true
    showScreen('lobby')
    setupLobby()
    connectSocket()
  } catch (e) {
    err.textContent = e.message
    err.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'CREATE GAME'
  }
}

async function joinByCode(code) {
  try {
    const game = await apiFetch('/api/games/' + code)

    if (game.status !== 'waiting') {
      showScreen('menu')
      setupMenuScreen()
      const err = document.getElementById('menu-error')
      err.textContent = 'This game already started'
      err.style.display = 'block'
      return
    }

    const alreadyIn = game.players.some(p => p.id === mp.playerId)
    mp.gameCode = code
    mp.isHost = (game.host.id === mp.playerId)

    if (alreadyIn) {
      showScreen('lobby')
      setupLobby()
      connectSocket()
      return
    }

    const result = await apiFetch('/api/games/' + code + '/join', { method: 'POST' })
    showScreen('lobby')
    setupLobby()
    connectSocket()

    if (result.status === 'pending') {
      document.getElementById('pending-section').style.display = 'block'
    }
  } catch (e) {
    showScreen('menu')
    setupMenuScreen()
    const err = document.getElementById('menu-error')
    err.textContent = e.message
    err.style.display = 'block'
  }
}

function setupLobby() {
  document.getElementById('lobby-code').textContent = mp.gameCode

  document.getElementById('copy-link-btn').onclick = () => {
    const url = window.location.origin + '/game/' + mp.gameCode
    navigator.clipboard.writeText(url).then(() => {
      document.getElementById('copy-link-btn').textContent = 'Copied!'
      setTimeout(() => {
        document.getElementById('copy-link-btn').textContent = 'Copy Share Link'
      }, 2000)
    })
  }

  if (mp.isHost) {
    document.getElementById('host-controls').style.display = 'block'
    document.getElementById('waiting-section').style.display = 'none'
    document.getElementById('start-game-btn').onclick = startGame
  } else {
    document.getElementById('host-controls').style.display = 'none'
    document.getElementById('waiting-section').style.display = 'block'
  }

  document.getElementById('lobby-back').onclick = (e) => {
    e.preventDefault()
    if (mp.socket) mp.socket.disconnect()
    mp.gameCode = null
    mp.isHost = false
    window.location.href = '/game/lobby.html'
  }
}

function updateLobbyPlayers(players, hostId) {
  const list = document.getElementById('lobby-players')
  list.innerHTML = ''

  players.forEach((p, i) => {
    const color = PLAYER_COLORS[p.colorIndex || i]
    const li = document.createElement('li')
    li.className = 'player-item'
    li.innerHTML = `
      <span class="player-dot" style="background:${color.fill}"></span>
      <span class="player-name">${escapeHtml(p.nickname)}</span>
      ${p.playerId === hostId ? '<span class="host-badge">HOST</span>' : ''}
    `
    list.appendChild(li)
  })

  const startBtn = document.getElementById('start-game-btn')
  if (startBtn && mp.isHost) {
    const enough = players.length >= 2
    startBtn.disabled = !enough
    startBtn.textContent = enough
      ? 'START GAME!'
      : 'START GAME (need 2+ players)'
  }
}

function showJoinRequest(playerId, nickname) {
  if (!mp.isHost) return
  mp.pendingRequests.push({ playerId, nickname })
  renderJoinRequests()
}

function renderJoinRequests() {
  const section = document.getElementById('join-requests-section')
  const list = document.getElementById('join-requests-list')

  if (mp.pendingRequests.length === 0) {
    section.style.display = 'none'
    return
  }

  section.style.display = 'block'
  list.innerHTML = ''

  mp.pendingRequests.forEach(req => {
    const div = document.createElement('div')
    div.className = 'request-item'
    div.innerHTML = `
      <span class="request-name">${escapeHtml(req.nickname)}</span>
      <button class="accept-btn" data-id="${req.playerId}">Accept</button>
      <button class="reject-btn" data-id="${req.playerId}">Reject</button>
    `
    div.querySelector('.accept-btn').onclick = () => acceptPlayer(req)
    div.querySelector('.reject-btn').onclick = () => rejectPlayer(req)
    list.appendChild(div)
  })
}

async function refreshPendingRequests() {
  try {
    const requests = await apiFetch('/api/games/' + mp.gameCode + '/requests')
    mp.pendingRequests = requests
    renderJoinRequests()
  } catch (e) {
    console.error('Failed to fetch requests:', e)
  }
}

async function acceptPlayer(req) {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId: req.requestId }),
    })
    mp.pendingRequests = mp.pendingRequests.filter(r => r.playerId !== req.playerId)
    renderJoinRequests()
    mp.socket.emit('accept-player', { code: mp.gameCode, targetPlayerId: req.playerId })
  } catch (e) {
    console.error('Accept failed:', e)
  }
}

async function rejectPlayer(req) {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/reject', {
      method: 'POST',
      body: JSON.stringify({ requestId: req.requestId }),
    })
    mp.pendingRequests = mp.pendingRequests.filter(r => r.playerId !== req.playerId)
    renderJoinRequests()
    mp.socket.emit('reject-player', { code: mp.gameCode, targetPlayerId: req.playerId })
  } catch (e) {
    console.error('Reject failed:', e)
  }
}

async function startGame() {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/start', { method: 'POST' })
    mp.socket.emit('start-game', { code: mp.gameCode })
  } catch (e) {
    const err = document.getElementById('lobby-error')
    err.textContent = e.message
    err.style.display = 'block'
  }
}

function connectSocket() {
  const script = document.createElement('script')
  script.src = MP_SERVER + '/socket.io/socket.io.js'
  script.onload = () => {
    mp.socket = io(MP_SERVER, {
      auth: { token: mp.token },
    })

    mp.socket.on('connect', () => {
      mp.socket.emit('lobby-join', { code: mp.gameCode })
    })

    mp.socket.on('lobby-update', ({ players, hostId }) => {
      updateLobbyPlayers(players, hostId)
    })

    mp.socket.on('join-request', async ({ playerId, nickname }) => {
      if (!mp.isHost) return
      await refreshPendingRequests()
    })

    mp.socket.on('player-accepted', ({ playerId }) => {
      if (playerId === mp.playerId) {
        document.getElementById('pending-section').style.display = 'none'
        if (!mp.isHost) {
          document.getElementById('waiting-section').style.display = 'block'
        }
      }
    })

    mp.socket.on('player-rejected', ({ playerId }) => {
      if (playerId === mp.playerId) {
        alert('Your join request was rejected.')
        window.location.href = '/game/lobby.html'
      }
    })

    mp.socket.on('countdown', ({ seconds }) => {
      showScreen('countdown')
      document.getElementById('countdown-number').textContent = seconds
    })

    mp.socket.on('game-start', ({ players }) => {
      mp.players = players
      showScreen('game')
      initGameCanvas()
    })

    mp.socket.on('snapshot', (snapshot) => {
      mp.prevSnapshot = mp.snapshot
      mp.snapshot = snapshot
    })

    mp.socket.on('game-over', ({ winner, results }) => {
      if (mp.animFrame) {
        cancelAnimationFrame(mp.animFrame)
        mp.animFrame = null
      }
      showResults(winner, results)
    })

    mp.socket.on('player-disconnected', ({ playerId }) => {
      // handled via snapshot (connected flag)
    })

    mp.socket.on('error-msg', ({ message }) => {
      console.error('Server error:', message)
    })

    mp.socket.emit('join-request', { code: mp.gameCode })
  }
  document.head.appendChild(script)
}

function initGameCanvas() {
  mp.canvas = document.getElementById('mp-canvas')
  mp.ctx = mp.canvas.getContext('2d')

  setupMPInput(mp.canvas)
  initSound()

  const sendRate = 1000 / 20
  setInterval(() => {
    if (mp.socket && mp.socket.connected) {
      let dx = 0, dy = 0

      if (mp.keys['w'] || mp.keys['arrowup']) dy -= 1
      if (mp.keys['s'] || mp.keys['arrowdown']) dy += 1
      if (mp.keys['a'] || mp.keys['arrowleft']) dx -= 1
      if (mp.keys['d'] || mp.keys['arrowright']) dx += 1

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy)
        dx /= len
        dy /= len
      }

      if (mp.touch.moveId !== null) {
        dx = mp.touch.moveDx
        dy = mp.touch.moveDy
      }

      const me = findMe()
      let angle = 0
      if (me) {
        if (mp.touch.shooting) {
          angle = Math.atan2(mp.touch.shootY - me.y, mp.touch.shootX - me.x)
        } else {
          angle = Math.atan2(mp.mouse.y - me.y, mp.mouse.x - me.x)
        }
      }

      const shooting = mp.mouse.down || mp.keys[' '] || mp.touch.shooting

      mp.socket.emit('input', { dx, dy, angle, shooting })
    }
  }, sendRate)

  gameLoop()
}

function findMe() {
  if (!mp.snapshot) return null
  return mp.snapshot.players.find(p => p.id === mp.myId)
}

function gameLoop() {
  renderGame()
  mp.animFrame = requestAnimationFrame(gameLoop)
}

function renderGame() {
  const ctx = mp.ctx
  if (!ctx || !mp.snapshot) return

  const ac = GAME_CONFIG.arena

  ctx.fillStyle = ac.grassColor
  ctx.fillRect(0, 0, 960, 640)

  ctx.fillStyle = ac.grassDot
  for (let gx = 20; gx < 960; gx += 50) {
    for (let gy = 20; gy < 640; gy += 50) {
      ctx.beginPath()
      ctx.arc(gx, gy, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.strokeStyle = ac.borderColor
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, 954, 634)

  ARENA_OBSTACLES.forEach(obs => {
    if (obs.type === 'wall') {
      ctx.fillStyle = ac.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = ac.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    } else {
      ctx.fillStyle = ac.boxColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = ac.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
      ctx.beginPath()
      ctx.moveTo(obs.x, obs.y)
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h)
      ctx.moveTo(obs.x + obs.w, obs.y)
      ctx.lineTo(obs.x, obs.y + obs.h)
      ctx.stroke()
    }
  })

  mp.snapshot.bullets.forEach(b => {
    const color = PLAYER_COLORS[b.colorIndex] || PLAYER_COLORS[0]
    ctx.fillStyle = color.bullet + '44'
    ctx.beginPath()
    ctx.arc(b.x, b.y, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = color.bullet
    ctx.beginPath()
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  mp.snapshot.players.forEach(p => {
    if (!p.alive) return
    const color = PLAYER_COLORS[p.colorIndex] || PLAYER_COLORS[0]
    const size = 20
    const isMe = (p.id === mp.myId)

    ctx.fillStyle = color.fill
    ctx.beginPath()
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = color.outline
    ctx.lineWidth = isMe ? 3 : 2
    ctx.stroke()

    if (isMe) {
      ctx.strokeStyle = '#ffffff44'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, size + 4, 0, Math.PI * 2)
      ctx.stroke()
    }

    drawFace(ctx, p.x, p.y, size, p.angle)
    drawHealthBar(ctx, p.x, p.y - size - 16, p.health, 100)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.nickname, p.x, p.y - size - 22)
    ctx.textAlign = 'start'
  })

  // Draw joystick for touch
  if (mp.joystick.visible) {
    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(mp.joystick.baseX, mp.joystick.baseY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(mp.joystick.stickX, mp.joystick.stickY, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  if (mp.touch.shooting) {
    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#ff6b35'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(mp.touch.shootX, mp.touch.shootY, 24, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  updateHUD()
}

function drawFace(ctx, x, y, size, angle) {
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
}

function drawHealthBar(ctx, cx, cy, health, maxHealth) {
  const w = 40
  const h = 5
  const ratio = health / maxHealth
  const x = cx - w / 2

  ctx.fillStyle = '#333333'
  ctx.fillRect(x, cy, w, h)
  ctx.fillStyle = ratio > 0.5 ? '#44dd44' : ratio > 0.25 ? '#dddd44' : '#dd4444'
  ctx.fillRect(x, cy, w * ratio, h)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 1
  ctx.strokeRect(x, cy, w, h)
}

function updateHUD() {
  if (!mp.snapshot) return
  const hud = document.getElementById('mp-hud')
  const sorted = [...mp.snapshot.players].sort((a, b) => b.score - a.score)

  hud.innerHTML = sorted.map(p => {
    const color = PLAYER_COLORS[p.colorIndex] || PLAYER_COLORS[0]
    const isMe = p.id === mp.myId
    return `<div class="hud-player" style="color:${color.fill}; ${isMe ? 'border:1px solid ' + color.fill : ''}">
      ${escapeHtml(p.nickname)}: ${p.score}
    </div>`
  }).join('')
}

function showResults(winnerId, results) {
  showScreen('results')
  const winnerData = results.find(r => r.playerId === winnerId)
  const isMe = winnerId === mp.myId

  document.getElementById('results-title').textContent =
    isMe ? 'YOU WIN!' : (winnerData ? winnerData.nickname + ' Wins!' : 'Game Over!')
  document.getElementById('results-title').style.color =
    isMe ? '#ffd700' : '#ff6b6b'

  const medals = ['🥇', '🥈', '🥉', '4th', '5th']
  const body = document.getElementById('results-body')
  body.innerHTML = results.map((r, i) => {
    const isWinner = r.playerId === winnerId
    return `<tr class="${isWinner ? 'winner' : ''}">
      <td class="placement-medal">${medals[i] || ''}</td>
      <td>${escapeHtml(r.nickname)}${r.playerId === mp.myId ? ' (you)' : ''}</td>
      <td>${r.score}</td>
      <td>${r.kills}</td>
      <td>${r.deaths}</td>
    </tr>`
  }).join('')
}

function setupMPInput(canvas) {
  window.addEventListener('keydown', e => {
    mp.keys[e.key.toLowerCase()] = true
    if (e.key === ' ') e.preventDefault()
  })

  window.addEventListener('keyup', e => {
    mp.keys[e.key.toLowerCase()] = false
  })

  canvas.addEventListener('mousemove', e => {
    const p = canvasPos(e, canvas)
    mp.mouse.x = p.x
    mp.mouse.y = p.y
  })

  canvas.addEventListener('mousedown', () => { mp.mouse.down = true })
  canvas.addEventListener('mouseup', () => { mp.mouse.down = false })
  canvas.addEventListener('contextmenu', e => e.preventDefault())

  canvas.addEventListener('touchstart', e => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      const p = touchPos(t, canvas)
      if (p.x < canvas.width / 2) {
        mp.touch.moveId = t.identifier
        mp.touch.moveStartX = p.x
        mp.touch.moveStartY = p.y
        mp.touch.moveDx = 0
        mp.touch.moveDy = 0
        mp.joystick.visible = true
        mp.joystick.baseX = p.x
        mp.joystick.baseY = p.y
        mp.joystick.stickX = p.x
        mp.joystick.stickY = p.y
      } else {
        mp.touch.shootId = t.identifier
        mp.touch.shootX = p.x
        mp.touch.shootY = p.y
        mp.touch.shooting = true
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      const p = touchPos(t, canvas)
      if (t.identifier === mp.touch.moveId) {
        const dx = p.x - mp.touch.moveStartX
        const dy = p.y - mp.touch.moveStartY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 50
        if (dist > 0) {
          const clamped = Math.min(dist, maxDist)
          mp.touch.moveDx = (dx / dist) * (clamped / maxDist)
          mp.touch.moveDy = (dy / dist) * (clamped / maxDist)
          mp.joystick.stickX = mp.touch.moveStartX + (dx / dist) * clamped
          mp.joystick.stickY = mp.touch.moveStartY + (dy / dist) * clamped
        }
      }
      if (t.identifier === mp.touch.shootId) {
        mp.touch.shootX = p.x
        mp.touch.shootY = p.y
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchend', e => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === mp.touch.moveId) {
        mp.touch.moveId = null
        mp.touch.moveDx = 0
        mp.touch.moveDy = 0
        mp.joystick.visible = false
      }
      if (t.identifier === mp.touch.shootId) {
        mp.touch.shootId = null
        mp.touch.shooting = false
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchcancel', () => {
    mp.touch.moveId = null
    mp.touch.moveDx = 0
    mp.touch.moveDy = 0
    mp.touch.shootId = null
    mp.touch.shooting = false
    mp.joystick.visible = false
  })
}

function canvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function touchPos(t, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (t.clientX - rect.left) * (canvas.width / rect.width),
    y: (t.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function initSound() {
  mp.soundCtx = new (window.AudioContext || window.webkitAudioContext)()
  document.addEventListener('click', () => {
    if (mp.soundCtx && mp.soundCtx.state === 'suspended') mp.soundCtx.resume()
  }, { once: true })
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

window.addEventListener('load', init)
