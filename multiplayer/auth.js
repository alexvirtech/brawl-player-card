import crypto from 'crypto'

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateToken() {
  return crypto.randomUUID() + '-' + crypto.randomBytes(16).toString('hex')
}

export function authMiddleware(prisma) {
  return async (req, res, next) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const token = header.slice(7)
    const tokenHash = hashToken(token)

    try {
      const player = await prisma.player.findUnique({
        where: { tokenHash },
      })

      if (!player) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      await prisma.player.update({
        where: { id: player.id },
        data: { lastSeenAt: new Date() },
      })

      req.player = player
      next()
    } catch (err) {
      console.error('Auth error:', err)
      res.status(500).json({ error: 'Auth failed' })
    }
  }
}

export async function authenticateSocket(prisma, token) {
  if (!token) return null
  const tokenHash = hashToken(token)
  const player = await prisma.player.findUnique({
    where: { tokenHash },
  })
  if (player) {
    await prisma.player.update({
      where: { id: player.id },
      data: { lastSeenAt: new Date() },
    })
  }
  return player
}
