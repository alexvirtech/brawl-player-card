const APPEARANCE_CATALOG = {
  body: [
    { id: 'body-default', label: 'Stocky', width: 1, height: 1 },
    { id: 'body-round', label: 'Round', width: 1.15, height: 0.9 },
    { id: 'body-compact', label: 'Compact', width: 0.9, height: 1.1 },
  ],
  face: [
    { id: 'face-friendly', label: 'Friendly', eyes: 'round', mouth: 'smile', brows: 'normal' },
    { id: 'face-brave', label: 'Brave', eyes: 'narrow', mouth: 'grin', brows: 'angled' },
    { id: 'face-funny', label: 'Funny', eyes: 'big', mouth: 'open', brows: 'raised' },
    { id: 'face-serious', label: 'Serious', eyes: 'narrow', mouth: 'flat', brows: 'low' },
  ],
  hairHat: [
    { id: 'hair-none', label: 'None', type: 'none' },
    { id: 'hair-simple', label: 'Short Hair', type: 'hair', color: '#5a3a1a' },
    { id: 'hat-cap-red', label: 'Red Cap', type: 'cap', color: '#dd3333' },
    { id: 'hat-cap-blue', label: 'Blue Cap', type: 'cap', color: '#3355cc' },
    { id: 'hat-helmet', label: 'Helmet', type: 'helmet', color: '#888899' },
    { id: 'hat-beanie', label: 'Beanie', type: 'beanie', color: '#44aa44' },
    { id: 'hair-spiky', label: 'Spiky Hair', type: 'spiky', color: '#ffcc00' },
  ],
  shirt: [
    { id: 'shirt-red', label: 'Red Tee', color: '#dd3333', accent: '#bb2222' },
    { id: 'shirt-blue', label: 'Blue Jacket', color: '#3366cc', accent: '#2244aa' },
    { id: 'shirt-yellow', label: 'Yellow Tee', color: '#ddbb22', accent: '#bb9911' },
    { id: 'shirt-green', label: 'Green Vest', color: '#33aa44', accent: '#228833' },
    { id: 'shirt-purple', label: 'Purple Hoodie', color: '#8844bb', accent: '#6633aa' },
  ],
  pants: [
    { id: 'pants-jeans', label: 'Jeans', color: '#445588', accent: '#334477' },
    { id: 'pants-shorts', label: 'Shorts', color: '#cc8844', accent: '#aa6633', short: true },
    { id: 'pants-dark', label: 'Dark Pants', color: '#333344', accent: '#222233' },
    { id: 'pants-combat', label: 'Combat', color: '#556644', accent: '#445533' },
  ],
  accessory: [
    { id: 'acc-none', label: 'None', type: 'none' },
    { id: 'acc-glasses', label: 'Glasses', type: 'glasses', color: '#333333' },
    { id: 'acc-sunglasses', label: 'Sunglasses', type: 'sunglasses', color: '#111111' },
    { id: 'acc-backpack', label: 'Backpack', type: 'backpack', color: '#886633' },
    { id: 'acc-scarf', label: 'Scarf', type: 'scarf', color: '#dd4444' },
  ],
}

const SKIN_COLORS = [
  '#f5c5a3', '#e8b48a', '#d4956b', '#bb7a52', '#8d5a3c',
]

const DEFAULT_APPEARANCE = {
  body: 'body-default',
  face: 'face-friendly',
  hairHat: 'hair-none',
  shirt: 'shirt-red',
  pants: 'pants-jeans',
  weapon: 'pistol',
  accessory: 'acc-none',
  skinColor: 0,
}

function getAppearanceItem(category, id) {
  const list = APPEARANCE_CATALOG[category]
  if (!list) return null
  return list.find(item => item.id === id) || list[0]
}

function validateAppearance(app) {
  const result = {}
  for (const key of Object.keys(DEFAULT_APPEARANCE)) {
    if (key === 'skinColor') {
      const v = parseInt(app?.[key])
      result[key] = (v >= 0 && v < SKIN_COLORS.length) ? v : 0
      continue
    }
    if (key === 'weapon') {
      const w = WEAPON_CATALOG.find(w => w.id === app?.[key])
      result[key] = w ? app[key] : DEFAULT_APPEARANCE[key]
      continue
    }
    const cat = APPEARANCE_CATALOG[key]
    if (cat) {
      const valid = cat.find(item => item.id === app?.[key])
      result[key] = valid ? app[key] : DEFAULT_APPEARANCE[key]
    } else {
      result[key] = DEFAULT_APPEARANCE[key]
    }
  }
  return result
}
