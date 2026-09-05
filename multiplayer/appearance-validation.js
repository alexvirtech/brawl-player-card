const VALID_BODY = ['body-default', 'body-round', 'body-compact', 'body-tall', 'body-big', 'body-tiny']
const VALID_FACE = ['face-friendly', 'face-brave', 'face-funny', 'face-serious', 'face-angry', 'face-cool', 'face-shocked', 'face-sleepy']
const VALID_HAIR = ['hair-none', 'hair-simple', 'hair-black', 'hair-blonde', 'hair-red', 'hair-spiky', 'hair-spiky-blue', 'hair-spiky-pink', 'hat-cap-red', 'hat-cap-blue', 'hat-cap-black', 'hat-cap-gold', 'hat-helmet', 'hat-helmet-gold', 'hat-beanie', 'hat-beanie-red', 'hat-beanie-blue', 'hat-crown', 'hat-bandana', 'hat-tophat']
const VALID_SHIRT = ['shirt-red', 'shirt-blue', 'shirt-yellow', 'shirt-green', 'shirt-purple', 'shirt-black', 'shirt-white', 'shirt-orange', 'shirt-pink', 'shirt-camo', 'shirt-striped', 'shirt-armor']
const VALID_PANTS = ['pants-jeans', 'pants-shorts', 'pants-dark', 'pants-combat', 'pants-white', 'pants-red', 'pants-blue-shorts', 'pants-black-shorts', 'pants-gold', 'pants-cargo']
const VALID_WEAPON = ['pistol', 'shotgun', 'blaster', 'rocket', 'bat', 'grenade', 'sniper', 'smg', 'crossbow', 'flamethrower', 'sword', 'hammer']
const VALID_ACC = ['acc-none', 'acc-glasses', 'acc-sunglasses', 'acc-backpack', 'acc-scarf', 'acc-scarf-blue', 'acc-cape', 'acc-cape-blue', 'acc-cape-gold', 'acc-medal', 'acc-chain', 'acc-bandolier']

const VALID_BRAWL = ['sirius', 'kenji', 'nori']

const SERVER_DEFAULT_APPEARANCE = {
  body: 'body-default',
  face: 'face-friendly',
  hairHat: 'hair-none',
  shirt: 'shirt-red',
  pants: 'pants-jeans',
  weapon: 'pistol',
  accessory: 'acc-none',
  skinColor: 0,
  brawlCharacter: 'sirius',
}

export function validateServerAppearance(app) {
  if (!app || typeof app !== 'object') return { ...SERVER_DEFAULT_APPEARANCE }
  return {
    body: VALID_BODY.includes(app.body) ? app.body : 'body-default',
    face: VALID_FACE.includes(app.face) ? app.face : 'face-friendly',
    hairHat: VALID_HAIR.includes(app.hairHat) ? app.hairHat : 'hair-none',
    shirt: VALID_SHIRT.includes(app.shirt) ? app.shirt : 'shirt-red',
    pants: VALID_PANTS.includes(app.pants) ? app.pants : 'pants-jeans',
    weapon: VALID_WEAPON.includes(app.weapon) ? app.weapon : 'pistol',
    accessory: VALID_ACC.includes(app.accessory) ? app.accessory : 'acc-none',
    skinColor: (Number.isInteger(app.skinColor) && app.skinColor >= 0 && app.skinColor <= 9) ? app.skinColor : 0,
    brawlCharacter: VALID_BRAWL.includes(app.brawlCharacter) ? app.brawlCharacter : 'sirius',
  }
}

export function validateFigureMode(mode) {
  if (mode === 'advanced') return 'advanced'
  if (mode === 'brawl') return 'brawl'
  return 'simple'
}
