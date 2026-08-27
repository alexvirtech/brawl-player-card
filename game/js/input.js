const Input = {
  keys: {},
  mouse: { x: 0, y: 0, down: false, clicked: false },

  init(canvas) {
    this.canvas = canvas

    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true
      if (e.key === ' ') e.preventDefault()
    })

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false
    })

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      this.mouse.x = (e.clientX - rect.left) * scaleX
      this.mouse.y = (e.clientY - rect.top) * scaleY
    })

    canvas.addEventListener('mousedown', () => {
      this.mouse.down = true
      this.mouse.clicked = true
    })

    canvas.addEventListener('mouseup', () => {
      this.mouse.down = false
    })

    canvas.addEventListener('contextmenu', e => e.preventDefault())
  },

  isDown(key) {
    return !!this.keys[key]
  },

  consumeClick() {
    if (this.mouse.clicked) {
      this.mouse.clicked = false
      return true
    }
    return false
  },
}
