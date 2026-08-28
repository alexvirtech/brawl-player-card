import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { createRoutes } from './routes.js'
import { setupSocket } from './socket.js'
import { RoomManager } from './rooms.js'

const prisma = new PrismaClient()
const app = express()
const server = createServer(app)

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.some(o => origin === o || origin.endsWith(o.replace('https://', '.').replace('http://', '.')))) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  },
  credentials: true,
}))

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

const roomManager = new RoomManager()
app.use(createRoutes(prisma, roomManager))

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

setupSocket(io, prisma, roomManager)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`)
})
