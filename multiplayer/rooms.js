import { GameWorld } from './game-world.js'
import { GAME_CFG, PLAYER_COLORS } from './game-config.js'

export class GameRoom {
  constructor(gameId, publicCode, hostId, hostNickname) {
    this.gameId = gameId
    this.publicCode = publicCode
    this.hostId = hostId
    this.status = 'waiting'
    this.slots = [{ playerId: hostId, nickname: hostNickname, colorIndex: 0 }]
    this.world = null
    this.tickInterval = null
    this.countdownTimer = null
    this.disconnectTimers = new Map()
    this.io = null
    this.onFinish = null
  }

  get playerIds() {
    return this.slots.map(s => s.playerId)
  }

  get socketRoom() {
    return `game:${this.publicCode}`
  }

  addPlayer(playerId, nickname) {
    if (this.slots.length >= GAME_CFG.maxPlayers) return false
    if (this.slots.some(s => s.playerId === playerId)) return false
    this.slots.push({
      playerId,
      nickname,
      colorIndex: this.slots.length,
    })
    return true
  }

  removePlayer(playerId) {
    this.slots = this.slots.filter(s => s.playerId !== playerId)
  }

  startCountdown(io) {
    this.io = io
    this.status = 'countdown'
    let count = GAME_CFG.countdownSeconds

    io.to(this.socketRoom).emit('countdown', { seconds: count })

    this.countdownTimer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
        this.startGame()
      } else {
        io.to(this.socketRoom).emit('countdown', { seconds: count })
      }
    }, 1000)
  }

  startGame() {
    this.status = 'playing'
    this.world = new GameWorld(this.slots)

    this.io.to(this.socketRoom).emit('game-start', {
      players: this.slots,
      arenaWidth: 960,
      arenaHeight: 640,
    })

    const dt = 1 / GAME_CFG.tickRate
    this.tickInterval = setInterval(() => {
      this.world.update(dt)
      const snapshot = this.world.getSnapshot()
      this.io.to(this.socketRoom).emit('snapshot', snapshot)

      if (snapshot.winner) {
        this.finishGame()
      }
    }, 1000 / GAME_CFG.tickRate)
  }

  handleInput(playerId, input) {
    if (this.world && this.status === 'playing') {
      this.world.setInput(playerId, input)
    }
  }

  handleDisconnect(playerId) {
    if (this.status === 'waiting') {
      this.removePlayer(playerId)
      return
    }

    if (this.world) {
      this.world.setConnected(playerId, false)
    }

    this.disconnectTimers.set(playerId, setTimeout(() => {
      this.disconnectTimers.delete(playerId)
      if (this.status === 'playing') {
        const remaining = [...this.world.players.values()]
          .filter(p => p.connected)
        if (remaining.length <= 1 && remaining.length < this.slots.length) {
          if (remaining.length === 1) {
            this.world.winner = remaining[0].id
          }
          this.finishGame()
        }
      }
    }, GAME_CFG.disconnectGrace))
  }

  handleReconnect(playerId) {
    const timer = this.disconnectTimers.get(playerId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(playerId)
    }
    if (this.world) {
      this.world.setConnected(playerId, true)
    }
  }

  finishGame() {
    this.status = 'finished'

    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }

    const results = this.world.getResults()
    this.io.to(this.socketRoom).emit('game-over', {
      winner: this.world.winner,
      results,
    })

    if (this.onFinish) {
      this.onFinish(this.gameId, this.world.winner, results)
    }
  }

  destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval)
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer)
    }
  }
}

export class RoomManager {
  constructor() {
    this.rooms = new Map()
    this.playerRoom = new Map()
  }

  createRoom(gameId, publicCode, hostId, hostNickname) {
    const room = new GameRoom(gameId, publicCode, hostId, hostNickname)
    this.rooms.set(publicCode, room)
    this.playerRoom.set(hostId, publicCode)
    return room
  }

  getRoom(publicCode) {
    return this.rooms.get(publicCode)
  }

  getRoomForPlayer(playerId) {
    const code = this.playerRoom.get(playerId)
    return code ? this.rooms.get(code) : null
  }

  addPlayerToRoom(publicCode, playerId) {
    this.playerRoom.set(playerId, publicCode)
  }

  removeRoom(publicCode) {
    const room = this.rooms.get(publicCode)
    if (room) {
      room.destroy()
      for (const slot of room.slots) {
        this.playerRoom.delete(slot.playerId)
      }
      this.rooms.delete(publicCode)
    }
  }

  removePlayerFromRoom(playerId) {
    const code = this.playerRoom.get(playerId)
    if (code) {
      const room = this.rooms.get(code)
      if (room) {
        room.handleDisconnect(playerId)
      }
      this.playerRoom.delete(playerId)
    }
  }
}
