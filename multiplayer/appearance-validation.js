const VALID_BODY = ['body-default', 'body-round', 'body-compact']
const VALID_FACE = ['face-friendly', 'face-brave', 'face-funny', 'face-serious']
const VALID_HAIR = ['hair-none', 'hair-simple', 'hat-cap-red', 'hat-cap-blue', 'hat-helmet', 'hat-beanie', 'hair-spiky']
const VALID_SHIRT = ['shirt-red', 'shirt-blue', 'shirt-yellow', 'shirt-green', 'shirt-purple']
const VALID_PANTS = ['pants-jeans', 'pants-shorts', 'pants-dark', 'pants-combat']
const VALID_WEAPON = ['pistol', 'shotgun', 'blaster', 'rocket', 'bat', 'grenade']
const VALID_ACC = ['acc-none', 'acc-glasses', 'acc-sunglasses', 'acc-backpack', 'acc-scarf']

const SERVER_DEFAULT_APPEARANCE = {
  body: 'body-default',
  face: 'face-friendly',
  hairHat: 'hair-none',
  shirt: 'shirt-red',
  pants: 'pants-jeans',
  weapon: 'pistol',
  accessory: 'acc-none',
  skinColor: 0,
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
    skinColor: (Number.isInteger(app.skinColor) && app.skinColor >= 0 && app.skinColor <= 4) ? app.skinColor : 0,
  }
}

export function validateFigureMode(mode) {
  return mode === 'advanced' ? 'advanced' : 'simple'
}
