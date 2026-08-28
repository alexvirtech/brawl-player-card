import { authenticateSocket } from './auth.js'

export function setupSocket(io, prisma, roomManager) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    const player = await authenticateSocket(prisma, token)
    if (!player) {
      return next(new Error('Authentication failed'))
    }
    socket.player = player
    next()
  })

  io.on('connection', (socket) => {
    const playerId = socket.player.id
    const nickname = socket.player.nickname
    console.log(`[ws] connect: ${nickname} (${playerId.slice(0, 8)})`)

    socket.on('lobby-join', ({ code }) => {
      const room = roomManager.getRoom(code)
      if (!room) {
        socket.emit('error-msg', { message: 'Game not found' })
        return
      }

      socket.join(room.socketRoom)

      if (room.playerIds.includes(playerId)) {
        roomManager.addPlayerToRoom(code, playerId)
      }

      if (room.status === 'playing' && room.playerIds.includes(playerId)) {
        room.handleReconnect(playerId)
        socket.emit('game-start', {
          players: room.slots,
          arenaWidth: 960,
          arenaHeight: 640,
        })
        const snapshot = room.world?.getSnapshot()
        if (snapshot) {
          socket.emit('snapshot', snapshot)
        }
        console.log(`[ws] ${nickname} reconnected to game ${code}`)
        return
      }

      io.to(room.socketRoom).emit('lobby-update', {
        players: room.slots,
        hostId: room.hostId,
      })
    })

    socket.on('join-request', async ({ code }) => {
      const room = roomManager.getRoom(code)
      if (!room) {
        socket.emit('error-msg', { message: 'Game not found' })
        return
      }

      io.to(room.socketRoom).emit('join-request', {
        playerId,
        nickname,
      })
    })

    socket.on('accept-player', async ({ code, targetPlayerId }) => {
      const room = roomManager.getRoom(code)
      if (!room || room.hostId !== playerId) return

      io.to(room.socketRoom).emit('player-accepted', {
        playerId: targetPlayerId,
      })

      io.to(room.socketRoom).emit('lobby-update', {
        players: room.slots,
        hostId: room.hostId,
      })
    })

    socket.on('reject-player', ({ code, targetPlayerId }) => {
      const room = roomManager.getRoom(code)
      if (!room || room.hostId !== playerId) return

      io.to(room.socketRoom).emit('player-rejected', {
        playerId: targetPlayerId,
      })
    })

    socket.on('start-game', async ({ code }) => {
      const room = roomManager.getRoom(code)
      if (!room || room.hostId !== playerId) return
      if (room.status !== 'waiting' || room.slots.length < 2) return

      console.log(`[ws] ${nickname} starting game ${code} (${room.slots.length} players)`)

      await prisma.game.update({
        where: { id: room.gameId },
        data: { status: 'countdown', startedAt: new Date() },
      })

      room.onFinish = async (gameId, winnerId, results) => {
        try {
          await prisma.game.update({
            where: { id: gameId },
            data: {
              status: 'finished',
              winnerId,
              endedAt: new Date(),
            },
          })

          for (const r of results) {
            await prisma.gamePlayer.updateMany({
              where: { gameId, playerId: r.playerId },
              data: {
                score: r.score,
                kills: r.kills,
                deaths: r.deaths,
                placement: r.placement,
              },
            })
          }
          console.log(`[ws] game ${code} results saved`)
        } catch (err) {
          console.error('Error saving results:', err)
        }
      }

      room.startCountdown(io)
    })

    socket.on('input', (input) => {
      const room = roomManager.getRoomForPlayer(playerId)
      if (!room) return
      room.handleInput(playerId, input)
    })

    socket.on('end-game', ({ code }) => {
      const room = roomManager.getRoom(code)
      if (!room || room.hostId !== playerId) return
      if (room.status !== 'playing') return
      console.log(`[ws] ${nickname} ended game ${code} early`)
      room.finishGame()
    })

    socket.on('nickname-change', ({ nickname: newName }) => {
      if (!newName || typeof newName !== 'string') return
      const trimmed = newName.trim()
      if (trimmed.length < 1 || trimmed.length > 20) return
      socket.player.nickname = trimmed
      const room = roomManager.getRoomForPlayer(playerId)
      if (!room) return
      const slot = room.slots.find(s => s.playerId === playerId)
      if (slot) slot.nickname = trimmed
      if (room.world) {
        const wp = room.world.players.get(playerId)
        if (wp) wp.nickname = trimmed
      }
      io.to(room.socketRoom).emit('nickname-updated', { playerId, nickname: trimmed })
    })

    socket.on('leave-game', ({ code }) => {
      const room = roomManager.getRoom(code)
      if (!room) return

      socket.leave(room.socketRoom)

      if (room.status === 'playing' && room.world) {
        room.world.setConnected(playerId, false)
        io.to(room.socketRoom).emit('player-disconnected', { playerId })
      }
    })

    socket.on('disconnect', () => {
      const room = roomManager.getRoomForPlayer(playerId)
      if (!room) return

      if (room.status === 'waiting') {
        room.removePlayer(playerId)
        roomManager.removePlayerFromRoom(playerId)

        if (room.slots.length === 0) {
          roomManager.removeRoom(room.publicCode)
        } else {
          io.to(room.socketRoom).emit('lobby-update', {
            players: room.slots,
            hostId: room.hostId,
          })
        }
      } else if (room.status === 'playing' || room.status === 'countdown') {
        room.handleDisconnect(playerId)
        io.to(room.socketRoom).emit('player-disconnected', { playerId })
      }
    })
  })
}
