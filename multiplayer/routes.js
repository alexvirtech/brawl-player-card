import { Router } from 'express'
import crypto from 'crypto'
import { hashToken, generateToken, authMiddleware } from './auth.js'
import { PLAYER_COLORS, GAME_CFG } from './game-config.js'

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createRoutes(prisma, roomManager) {
  const router = Router()
  const auth = authMiddleware(prisma)

  router.post('/api/players', async (req, res) => {
    const { nickname } = req.body
    if (!nickname || nickname.trim().length < 1 || nickname.trim().length > 20) {
      return res.status(400).json({ error: 'Nickname must be 1-20 characters' })
    }

    const token = generateToken()
    const tokenHash = hashToken(token)

    const player = await prisma.player.create({
      data: {
        nickname: nickname.trim(),
        tokenHash,
      },
    })

    res.json({
      id: player.id,
      nickname: player.nickname,
      token,
    })
  })

  router.patch('/api/players/me', auth, async (req, res) => {
    const { nickname } = req.body
    if (!nickname || nickname.trim().length < 1 || nickname.trim().length > 20) {
      return res.status(400).json({ error: 'Nickname must be 1-20 characters' })
    }
    const updated = await prisma.player.update({
      where: { id: req.player.id },
      data: { nickname: nickname.trim() },
    })
    res.json({ id: updated.id, nickname: updated.nickname })
  })

  router.get('/api/players/me', auth, async (req, res) => {
    const stats = await prisma.gamePlayer.aggregate({
      where: { playerId: req.player.id },
      _sum: { kills: true, deaths: true, score: true },
      _count: true,
    })

    const wins = await prisma.game.count({
      where: { winnerId: req.player.id, status: 'finished' },
    })

    res.json({
      id: req.player.id,
      nickname: req.player.nickname,
      createdAt: req.player.createdAt,
      stats: {
        gamesPlayed: stats._count,
        totalKills: stats._sum.kills || 0,
        totalDeaths: stats._sum.deaths || 0,
        totalScore: stats._sum.score || 0,
        wins,
      },
    })
  })

  router.get('/api/players/me/history', auth, async (req, res) => {
    const games = await prisma.gamePlayer.findMany({
      where: { playerId: req.player.id },
      include: {
        game: {
          include: {
            players: {
              include: { player: { select: { id: true, nickname: true } } },
              orderBy: { placement: 'asc' },
            },
          },
        },
      },
      orderBy: { game: { createdAt: 'desc' } },
      take: 20,
    })

    res.json(games.map(gp => ({
      gameId: gp.gameId,
      code: gp.game.publicCode,
      status: gp.game.status,
      createdAt: gp.game.createdAt,
      myScore: gp.score,
      myKills: gp.kills,
      myDeaths: gp.deaths,
      myPlacement: gp.placement,
      players: gp.game.players.map(p => ({
        nickname: p.player.nickname,
        score: p.score,
        placement: p.placement,
      })),
    })))
  })

  router.post('/api/games', auth, async (req, res) => {
    const existingRoom = roomManager.getRoomForPlayer(req.player.id)
    if (existingRoom && existingRoom.status === 'waiting') {
      return res.status(400).json({ error: 'You are already in a game lobby' })
    }

    let publicCode
    for (let i = 0; i < 10; i++) {
      publicCode = generateCode()
      const exists = await prisma.game.findUnique({ where: { publicCode } })
      if (!exists) break
    }

    const game = await prisma.game.create({
      data: {
        publicCode,
        hostId: req.player.id,
        players: {
          create: {
            playerId: req.player.id,
            color: 0,
          },
        },
      },
    })

    const room = roomManager.createRoom(
      game.id, publicCode, req.player.id, req.player.nickname
    )

    res.json({
      gameId: game.id,
      publicCode,
      shareUrl: `/game/${publicCode}`,
    })
  })

  router.get('/api/games/:code', async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
      include: {
        host: { select: { id: true, nickname: true } },
        players: {
          include: { player: { select: { id: true, nickname: true } } },
        },
      },
    })

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    res.json({
      gameId: game.id,
      publicCode: game.publicCode,
      status: game.status,
      host: game.host,
      players: game.players.map((gp, i) => ({
        id: gp.player.id,
        nickname: gp.player.nickname,
        color: PLAYER_COLORS[gp.color] || PLAYER_COLORS[0],
        colorIndex: gp.color,
      })),
    })
  })

  router.post('/api/games/:code/join', auth, async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' })
    }

    if (game.players.length >= GAME_CFG.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' })
    }

    if (game.players.some(p => p.playerId === req.player.id)) {
      return res.status(400).json({ error: 'Already in this game' })
    }

    const existing = await prisma.joinRequest.findUnique({
      where: {
        gameId_playerId: {
          gameId: game.id,
          playerId: req.player.id,
        },
      },
    })

    if (existing && existing.status === 'pending') {
      return res.json({ requestId: existing.id, status: 'pending' })
    }

    if (existing && existing.status === 'rejected') {
      return res.status(403).json({ error: 'Join request was rejected' })
    }

    const request = await prisma.joinRequest.create({
      data: {
        gameId: game.id,
        playerId: req.player.id,
      },
    })

    res.json({ requestId: request.id, status: 'pending' })
  })

  router.get('/api/games/:code/requests', auth, async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
    })

    if (!game || game.hostId !== req.player.id) {
      return res.status(403).json({ error: 'Only the host can view requests' })
    }

    const requests = await prisma.joinRequest.findMany({
      where: { gameId: game.id, status: 'pending' },
      include: { player: { select: { id: true, nickname: true } } },
    })

    res.json(requests.map(r => ({
      requestId: r.id,
      playerId: r.player.id,
      nickname: r.player.nickname,
    })))
  })

  router.post('/api/games/:code/accept', auth, async (req, res) => {
    const { requestId } = req.body
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
    })

    if (!game || game.hostId !== req.player.id) {
      return res.status(403).json({ error: 'Only the host can accept' })
    }

    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { player: true },
    })

    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid request' })
    }

    const playerCount = await prisma.gamePlayer.count({
      where: { gameId: game.id },
    })

    if (playerCount >= GAME_CFG.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' })
    }

    await prisma.$transaction([
      prisma.joinRequest.update({
        where: { id: requestId },
        data: {
          status: 'accepted',
          decidedAt: new Date(),
          decidedById: req.player.id,
        },
      }),
      prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          playerId: request.playerId,
          color: playerCount,
        },
      }),
    ])

    const room = roomManager.getRoom(game.publicCode)
    if (room) {
      room.addPlayer(request.playerId, request.player.nickname)
      roomManager.addPlayerToRoom(game.publicCode, request.playerId)
    }

    res.json({ accepted: true, playerId: request.playerId })
  })

  router.post('/api/games/:code/reject', auth, async (req, res) => {
    const { requestId } = req.body
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
    })

    if (!game || game.hostId !== req.player.id) {
      return res.status(403).json({ error: 'Only the host can reject' })
    }

    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        decidedAt: new Date(),
        decidedById: req.player.id,
      },
    })

    res.json({ rejected: true })
  })

  router.post('/api/games/:code/start', auth, async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { publicCode: req.params.code },
      include: { players: true },
    })

    if (!game || game.hostId !== req.player.id) {
      return res.status(403).json({ error: 'Only the host can start' })
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' })
    }

    if (game.players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players' })
    }

    await prisma.game.update({
      where: { id: game.id },
      data: { status: 'countdown' },
    })

    res.json({ started: true })
  })

  return router
}
