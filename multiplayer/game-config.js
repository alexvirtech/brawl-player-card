export const ARENA = {
  width: 960,
  height: 640,
  obstacles: [
    { x: 150, y: 130, w: 120, h: 20, type: 'wall' },
    { x: 690, y: 130, w: 120, h: 20, type: 'wall' },
    { x: 370, y: 230, w: 220, h: 20, type: 'wall' },
    { x: 370, y: 390, w: 220, h: 20, type: 'wall' },
    { x: 150, y: 490, w: 120, h: 20, type: 'wall' },
    { x: 690, y: 490, w: 120, h: 20, type: 'wall' },
    { x: 380, y: 290, w: 44, h: 44, type: 'box' },
    { x: 536, y: 290, w: 44, h: 44, type: 'box' },
  ],
}

export const PLAYER_CFG = {
  speed: 220,
  health: 100,
  size: 20,
  shootCooldown: 300,
}

export const BULLET_CFG = {
  speed: 500,
  damage: 25,
  size: 6,
  lifetime: 2000,
}

export const GAME_CFG = {
  winningScore: 5,
  respawnDelay: 3000,
  maxPlayers: 5,
  tickRate: 20,
  countdownSeconds: 3,
  disconnectGrace: 20000,
}

export const SPAWN_POINTS = [
  { x: 100, y: 320 },
  { x: 860, y: 320 },
  { x: 480, y: 100 },
  { x: 480, y: 540 },
  { x: 860, y: 100 },
]

export const PLAYER_COLORS = [
  { fill: '#4488ff', outline: '#2266cc', bullet: '#44ddff', name: 'Blue' },
  { fill: '#ff4455', outline: '#cc2233', bullet: '#ff8844', name: 'Red' },
  { fill: '#44dd44', outline: '#22aa22', bullet: '#88ff88', name: 'Green' },
  { fill: '#ff8844', outline: '#cc6622', bullet: '#ffaa66', name: 'Orange' },
  { fill: '#aa55ff', outline: '#7733cc', bullet: '#cc88ff', name: 'Purple' },
]
