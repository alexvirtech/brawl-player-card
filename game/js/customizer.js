const Customizer = {
  _el: null,
  _previewCanvas: null,
  _previewCtx: null,
  _open: false,
  _tempAppearance: null,

  init() {
    this._injectStyles()
    this._buildUI()
  },

  _injectStyles() {
    if (document.getElementById('customizer-styles')) return
    const style = document.createElement('style')
    style.id = 'customizer-styles'
    style.textContent =
      '#customizer-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);display:none;align-items:center;justify-content:center;z-index:900;padding:12px}' +
      '#customizer-overlay.open{display:flex}' +
      '#customizer-panel{background:#1a1a2e;border-radius:16px;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;position:relative;border:1px solid rgba(255,255,255,.1)}' +
      '.cust-close{position:absolute;top:10px;right:10px;background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center}' +
      '.cust-close:hover{color:#fff;background:rgba(255,255,255,.1)}' +
      '.cust-title{text-align:center;font-size:1.2rem;font-weight:900;color:#ffd700;margin-bottom:12px}' +
      '.cust-mode-toggle{display:flex;gap:6px;margin-bottom:16px;background:rgba(255,255,255,.06);border-radius:10px;padding:4px}' +
      '.cust-mode-btn{flex:1;padding:10px;border:none;border-radius:8px;font-weight:800;font-size:.85rem;cursor:pointer;transition:all .15s;background:transparent;color:#888}' +
      '.cust-mode-btn.active{background:linear-gradient(135deg,#ffd700,#ff6b35);color:#1a1a2e}' +
      '#cust-preview-wrap{text-align:center;margin:12px 0}' +
      '#cust-preview{border-radius:12px;background:#0a0a1e}' +
      '#cust-advanced-opts{display:none}' +
      '#cust-advanced-opts.show{display:block}' +
      '.cust-section{margin:10px 0}' +
      '.cust-section-label{font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}' +
      '.cust-options{display:flex;flex-wrap:wrap;gap:6px}' +
      '.cust-opt{padding:8px 14px;border:2px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.05);color:#ccc;font-size:.8rem;font-weight:700;cursor:pointer;transition:all .15s}' +
      '.cust-opt:hover{border-color:rgba(255,215,0,.3);background:rgba(255,215,0,.06)}' +
      '.cust-opt.selected{border-color:#ffd700;background:rgba(255,215,0,.15);color:#ffd700}' +
      '.cust-color-opt{width:36px;height:36px;border:3px solid rgba(255,255,255,.1);border-radius:50%;cursor:pointer;transition:all .15s;padding:0}' +
      '.cust-color-opt.selected{border-color:#ffd700;box-shadow:0 0 8px rgba(255,215,0,.4)}' +
      '.cust-actions{display:flex;gap:8px;margin-top:16px}' +
      '.cust-actions button{flex:1;padding:10px;border:none;border-radius:10px;font-weight:800;font-size:.85rem;cursor:pointer;transition:transform .15s}' +
      '.cust-save{background:linear-gradient(135deg,#ffd700,#ff6b35);color:#1a1a2e}' +
      '.cust-reset{background:rgba(255,255,255,.08);color:#888}'
    document.head.appendChild(style)
  },

  _buildUI() {
    const overlay = document.createElement('div')
    overlay.id = 'customizer-overlay'
    overlay.onclick = (e) => { if (e.target === overlay) this.close() }

    overlay.innerHTML =
      '<div id="customizer-panel">' +
        '<button class="cust-close" onclick="Customizer.close()">&times;</button>' +
        '<div class="cust-title">CHARACTER SETTINGS</div>' +
        '<div class="cust-mode-toggle">' +
          '<button class="cust-mode-btn" data-mode="simple" onclick="Customizer._setMode(\'simple\')">SIMPLE</button>' +
          '<button class="cust-mode-btn" data-mode="advanced" onclick="Customizer._setMode(\'advanced\')">ADVANCED</button>' +
        '</div>' +
        '<div id="cust-preview-wrap"><canvas id="cust-preview" width="120" height="120"></canvas></div>' +
        '<div id="cust-advanced-opts">' +
          this._buildSection('Skin', 'skinColor', SKIN_COLORS.map((c, i) => ({ id: i, color: c })), true) +
          this._buildSection('Body', 'body', APPEARANCE_CATALOG.body) +
          this._buildSection('Face', 'face', APPEARANCE_CATALOG.face) +
          this._buildSection('Hair / Hat', 'hairHat', APPEARANCE_CATALOG.hairHat) +
          this._buildSection('Shirt', 'shirt', APPEARANCE_CATALOG.shirt) +
          this._buildSection('Pants', 'pants', APPEARANCE_CATALOG.pants) +
          this._buildSection('Weapon', 'weapon', WEAPON_CATALOG) +
          this._buildSection('Accessory', 'accessory', APPEARANCE_CATALOG.accessory) +
        '</div>' +
        '<div class="cust-actions">' +
          '<button class="cust-reset" onclick="Customizer._reset()">RESET</button>' +
          '<button class="cust-save" onclick="Customizer._save()">SAVE</button>' +
        '</div>' +
      '</div>'

    document.body.appendChild(overlay)
    this._el = overlay
    this._previewCanvas = document.getElementById('cust-preview')
    this._previewCtx = this._previewCanvas.getContext('2d')
  },

  _buildSection(label, key, items, isColor) {
    let opts = ''
    if (isColor) {
      opts = items.map(item =>
        '<button class="cust-color-opt" data-cat="' + key + '" data-id="' + item.id + '" ' +
        'style="background:' + item.color + '" ' +
        'onclick="Customizer._pick(\'' + key + '\',' + item.id + ')"></button>'
      ).join('')
    } else {
      opts = items.map(item =>
        '<button class="cust-opt" data-cat="' + key + '" data-id="' + item.id + '" ' +
        'onclick="Customizer._pick(\'' + key + '\',\'' + item.id + '\')">' + item.label + '</button>'
      ).join('')
    }
    return '<div class="cust-section"><div class="cust-section-label">' + label + '</div><div class="cust-options">' + opts + '</div></div>'
  },

  open() {
    if (!this._el) this.init()
    this._tempAppearance = Object.assign({}, Player.appearance || DEFAULT_APPEARANCE)
    this._open = true
    this._el.classList.add('open')
    this._updateModeButtons(Player.figureMode)
    this._updateSelections()
    this._renderPreview()
  },

  close() {
    this._open = false
    if (this._el) this._el.classList.remove('open')
  },

  _setMode(mode) {
    Player.saveFigureMode(mode)
    this._updateModeButtons(mode)
    this._renderPreview()
  },

  _updateModeButtons(mode) {
    const btns = this._el.querySelectorAll('.cust-mode-btn')
    btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode))
    const advPanel = document.getElementById('cust-advanced-opts')
    if (mode === 'advanced') {
      advPanel.classList.add('show')
    } else {
      advPanel.classList.remove('show')
    }
  },

  _pick(cat, val) {
    this._tempAppearance[cat] = val
    this._updateSelections()
    this._renderPreview()
  },

  _updateSelections() {
    const app = this._tempAppearance
    const allOpts = this._el.querySelectorAll('[data-cat]')
    allOpts.forEach(el => {
      const cat = el.dataset.cat
      const id = el.dataset.id
      const match = (cat === 'skinColor') ? (parseInt(id) === app[cat]) : (id === app[cat])
      el.classList.toggle('selected', match)
    })
  },

  _renderPreview() {
    const ctx = this._previewCtx
    const w = this._previewCanvas.width
    const h = this._previewCanvas.height
    ctx.clearRect(0, 0, w, h)

    const x = w / 2
    const y = h / 2 + 5

    if (Player.figureMode === 'advanced' && typeof AdvancedRenderer !== 'undefined') {
      const animState = { time: performance.now() / 1000, walking: false, lowHealth: false, dead: false, hitFlash: 0, attackFlash: 0 }
      AdvancedRenderer.drawCharacter(ctx, x, y, 28, Math.PI / 2, this._tempAppearance, animState)
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.beginPath()
      ctx.ellipse(x, y + 20, 16, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      const grad = ctx.createRadialGradient(x - 6, y - 6, 1, x, y, 22)
      grad.addColorStop(0, '#99ddff')
      grad.addColorStop(0.5, '#4499ff')
      grad.addColorStop(1, '#2255bb')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 3
      ctx.stroke()

      for (const side of [-1, 1]) {
        const ex = x + side * 7
        const ey = y - 2
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(ex, ey, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2255cc'
        ctx.beginPath()
        ctx.arc(ex, ey + 1, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#111'
        ctx.beginPath()
        ctx.arc(ex, ey + 1.5, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y + 7, 5, 0.2, Math.PI - 0.2)
      ctx.stroke()
    }
  },

  _save() {
    Player.saveAppearance(this._tempAppearance)
    this.close()
  },

  _reset() {
    this._tempAppearance = Object.assign({}, DEFAULT_APPEARANCE)
    this._updateSelections()
    this._renderPreview()
  },
}
