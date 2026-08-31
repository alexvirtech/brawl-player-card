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

export const WEAPONS = {
  pistol:       { damage: 25, speed: 500, cooldown: 300,  size: 6,  range: 2000, pellets: 1, spread: 0 },
  shotgun:      { damage: 15, speed: 450, cooldown: 600,  size: 5,  range: 800,  pellets: 4, spread: 0.25 },
  blaster:      { damage: 20, speed: 600, cooldown: 250,  size: 7,  range: 2000, pellets: 1, spread: 0 },
  rocket:       { damage: 45, speed: 300, cooldown: 1200, size: 10, range: 2000, pellets: 1, spread: 0 },
  bat:          { damage: 35, speed: 0,   cooldown: 500,  size: 0,  range: 55,   pellets: 0, spread: 0, melee: true },
  grenade:      { damage: 40, speed: 350, cooldown: 1500, size: 8,  range: 1200, pellets: 1, spread: 0 },
  sniper:       { damage: 50, speed: 900, cooldown: 1500, size: 4,  range: 3000, pellets: 1, spread: 0 },
  smg:          { damage: 10, speed: 550, cooldown: 120,  size: 4,  range: 1200, pellets: 1, spread: 0.08 },
  crossbow:     { damage: 35, speed: 700, cooldown: 900,  size: 5,  range: 2500, pellets: 1, spread: 0 },
  flamethrower: { damage: 8,  speed: 300, cooldown: 60,   size: 8,  range: 400,  pellets: 2, spread: 0.15 },
  sword:        { damage: 40, speed: 0,   cooldown: 400,  size: 0,  range: 65,   pellets: 0, spread: 0, melee: true },
  hammer:       { damage: 55, speed: 0,   cooldown: 800,  size: 0,  range: 50,   pellets: 0, spread: 0, melee: true },
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
