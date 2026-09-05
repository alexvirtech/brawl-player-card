const Chat = {
  messages: [],
  maxMessages: 50,
  isOpen: false,
  unread: 0,
  socket: null,
  nickname: '',
  recognition: null,
  isRecording: false,
  translatedText: '',
  showTranslation: false,
  _uiReady: false,
  _bound: false,

  init(socket, nickname) {
    this.socket = socket
    this.nickname = nickname || ''
    if (!this._uiReady) {
      this._injectUI()
      this._uiReady = true
    }
    if (!this._bound) {
      this._bindEvents()
      this._bound = true
    }
    this._setupSocketListeners()
  },

  show() {
    if (!this._uiReady) {
      this._injectUI()
      this._uiReady = true
    }
    if (!this._bound) {
      this._bindEvents()
      this._bound = true
    }
  },

  attachSocket(socket, nickname) {
    this.socket = socket
    this.nickname = nickname || this.nickname
    this._setupSocketListeners()
  },

  destroy() {
    this.stopRecording()
    const el = document.getElementById('chat-container')
    if (el) el.remove()
    const btn = document.getElementById('chat-toggle-btn')
    if (btn) btn.remove()
    this._uiReady = false
    this._bound = false
  },

  updateNickname(name) {
    this.nickname = name
  },

  _injectUI() {
    if (document.getElementById('chat-container')) return

    const style = document.createElement('style')
    style.textContent = `
      #chat-toggle-btn {
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #4488ff, #6644cc);
        color: #fff;
        font-size: 1.4rem;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 3px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s;
      }
      #chat-toggle-btn:hover { transform: scale(1.1); }
      #chat-toggle-btn:active { transform: scale(0.95); }
      #chat-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        background: #ff3355;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 800;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
      }
      #chat-container {
        position: fixed;
        bottom: 74px;
        right: 16px;
        width: 320px;
        max-height: 420px;
        background: rgba(18, 18, 32, 0.96);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        backdrop-filter: blur(12px);
      }
      #chat-container.open { display: flex; }
      #chat-header {
        padding: 10px 14px;
        background: rgba(255,255,255,0.04);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        font-weight: 800;
        font-size: 0.85rem;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #chat-close {
        background: none;
        border: none;
        color: #888;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0 4px;
      }
      #chat-close:hover { color: #fff; }
      #chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 8px 10px;
        min-height: 180px;
        max-height: 280px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      #chat-messages::-webkit-scrollbar { width: 4px; }
      #chat-messages::-webkit-scrollbar-track { background: transparent; }
      #chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      .chat-msg {
        padding: 4px 0;
        font-size: 0.82rem;
        line-height: 1.35;
        word-wrap: break-word;
        color: #ccc;
      }
      .chat-msg .chat-name {
        font-weight: 800;
        margin-right: 6px;
      }
      .chat-msg.system {
        color: #888;
        font-style: italic;
        font-size: 0.75rem;
      }
      .chat-msg.self .chat-name { color: #4488ff; }
      #chat-translation {
        display: none;
        padding: 4px 10px 6px;
        background: rgba(68,136,255,0.1);
        border-top: 1px solid rgba(68,136,255,0.2);
        font-size: 0.75rem;
        color: #88bbff;
      }
      #chat-translation.show { display: block; }
      #chat-translation .trans-label {
        font-weight: 700;
        color: #6699dd;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      #chat-translation .trans-text {
        margin-top: 2px;
        color: #aaddff;
      }
      #chat-input-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 8px;
        border-top: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
      }
      #chat-input {
        flex: 1;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        padding: 8px 10px;
        color: #fff;
        font-size: 0.85rem;
        outline: none;
      }
      #chat-input:focus { border-color: #4488ff; }
      #chat-input::placeholder { color: #555; }
      #chat-mic-btn, #chat-send-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
        transition: transform 0.1s;
      }
      #chat-mic-btn {
        background: rgba(255,255,255,0.08);
        color: #aaa;
      }
      #chat-mic-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
      #chat-mic-btn.recording {
        background: rgba(255,50,80,0.3);
        color: #ff4466;
        animation: mic-pulse 1s ease-in-out infinite;
      }
      @keyframes mic-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,50,80,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(255,50,80,0); }
      }
      #chat-send-btn {
        background: #4488ff;
        color: #fff;
      }
      #chat-send-btn:hover { background: #5599ff; }
      #chat-send-btn:active { transform: scale(0.9); }
      .chat-empty {
        text-align: center;
        color: #555;
        font-size: 0.8rem;
        padding: 40px 10px;
      }
      @media (max-width: 480px) {
        #chat-container {
          width: calc(100vw - 32px);
          right: 16px;
          bottom: 70px;
          max-height: 360px;
        }
      }
    `
    document.head.appendChild(style)

    const toggleBtn = document.createElement('button')
    toggleBtn.id = 'chat-toggle-btn'
    toggleBtn.innerHTML = '<span style="line-height:1">&#x1F4AC;</span><span id="chat-badge">0</span>'
    document.body.appendChild(toggleBtn)

    const container = document.createElement('div')
    container.id = 'chat-container'
    container.innerHTML = `
      <div id="chat-header">
        <span>CHAT</span>
        <button id="chat-close">&times;</button>
      </div>
      <div id="chat-messages">
        <div class="chat-empty">No messages yet</div>
      </div>
      <div id="chat-translation">
        <div class="trans-label">Hebrew &rarr; English</div>
        <div class="trans-text" id="chat-trans-text"></div>
      </div>
      <div id="chat-input-row">
        <input type="text" id="chat-input" placeholder="Type a message..." maxlength="200" autocomplete="off">
        <button id="chat-mic-btn" title="Voice input">&#x1F3A4;</button>
        <button id="chat-send-btn" title="Send">&#x27A4;</button>
      </div>
    `
    document.body.appendChild(container)
  },

  _bindEvents() {
    const toggleBtn = document.getElementById('chat-toggle-btn')
    const closeBtn = document.getElementById('chat-close')
    const input = document.getElementById('chat-input')
    const sendBtn = document.getElementById('chat-send-btn')
    const micBtn = document.getElementById('chat-mic-btn')

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })

    closeBtn.addEventListener('click', () => this.close())

    input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        this.send()
      }
    })

    input.addEventListener('keyup', (e) => e.stopPropagation())
    input.addEventListener('keypress', (e) => e.stopPropagation())

    input.addEventListener('input', () => {
      this._checkHebrew(input.value)
    })

    sendBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.send()
    })

    micBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleRecording()
    })

    const container = document.getElementById('chat-container')
    container.addEventListener('mousedown', (e) => e.stopPropagation())
    container.addEventListener('touchstart', (e) => e.stopPropagation())
    toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation())
    toggleBtn.addEventListener('touchstart', (e) => e.stopPropagation())
  },

  _setupSocketListeners() {
    if (!this.socket) return

    this.socket.on('chat-message', (msg) => {
      this._addMessage(msg)
      if (!this.isOpen) {
        this.unread++
        this._updateBadge()
      }
    })
  },

  toggle() {
    if (this.isOpen) this.close()
    else this.open()
  },

  open() {
    this.isOpen = true
    this.unread = 0
    this._updateBadge()
    document.getElementById('chat-container').classList.add('open')
    document.getElementById('chat-input').focus()
  },

  close() {
    this.isOpen = false
    document.getElementById('chat-container').classList.remove('open')
  },

  _updateBadge() {
    const badge = document.getElementById('chat-badge')
    if (!badge) return
    if (this.unread > 0) {
      badge.textContent = this.unread > 99 ? '99+' : this.unread
      badge.style.display = 'flex'
    } else {
      badge.style.display = 'none'
    }
  },

  _containsHebrew(text) {
    return /[֐-׿]/.test(text)
  },

  async _checkHebrew(text) {
    const transEl = document.getElementById('chat-translation')
    const transText = document.getElementById('chat-trans-text')

    if (!text.trim() || !this._containsHebrew(text)) {
      transEl.classList.remove('show')
      this.translatedText = ''
      this.showTranslation = false
      return
    }

    transEl.classList.add('show')
    transText.textContent = 'Translating...'
    this.showTranslation = true

    try {
      const encoded = encodeURIComponent(text.trim())
      const res = await fetch('https://api.mymemory.translated.net/get?q=' + encoded + '&langpair=he|en')
      const data = await res.json()
      if (data.responseData && data.responseData.translatedText) {
        this.translatedText = data.responseData.translatedText
        transText.textContent = this.translatedText
      } else {
        transText.textContent = 'Translation unavailable'
        this.translatedText = ''
      }
    } catch (err) {
      transText.textContent = 'Translation failed'
      this.translatedText = ''
    }
  },

  send() {
    const input = document.getElementById('chat-input')
    let text = input.value.trim()
    if (!text) return

    let finalText = text
    let originalText = ''

    if (this._containsHebrew(text) && this.translatedText) {
      originalText = text
      finalText = this.translatedText
    }

    if (this.socket) {
      this.socket.emit('chat-message', {
        text: finalText,
        original: originalText || undefined,
      })
    }

    input.value = ''
    document.getElementById('chat-translation').classList.remove('show')
    this.translatedText = ''
    this.showTranslation = false
  },

  _addMessage(msg) {
    const msgArea = document.getElementById('chat-messages')
    const empty = msgArea.querySelector('.chat-empty')
    if (empty) empty.remove()

    this.messages.push(msg)
    if (this.messages.length > this.maxMessages) {
      this.messages.shift()
      if (msgArea.firstChild) msgArea.removeChild(msgArea.firstChild)
    }

    const div = document.createElement('div')
    div.className = 'chat-msg'

    if (msg.system) {
      div.className += ' system'
      div.textContent = msg.text
    } else {
      const isSelf = msg.playerId === mp.myId
      if (isSelf) div.className += ' self'
      const nameSpan = document.createElement('span')
      nameSpan.className = 'chat-name'
      nameSpan.style.color = msg.color || '#ffd700'
      nameSpan.textContent = msg.nickname + ':'
      div.appendChild(nameSpan)

      const textNode = document.createTextNode(' ' + msg.text)
      div.appendChild(textNode)

      if (msg.original) {
        const origSpan = document.createElement('div')
        origSpan.style.cssText = 'font-size:0.72rem;color:#777;margin-top:1px;direction:rtl;text-align:right'
        origSpan.textContent = msg.original
        div.appendChild(origSpan)
      }
    }

    msgArea.appendChild(div)
    msgArea.scrollTop = msgArea.scrollHeight
  },

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording()
    } else {
      this.startRecording()
    }
  },

  startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      this._addMessage({ system: true, text: 'Voice input not supported in this browser' })
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'he-IL'

    const input = document.getElementById('chat-input')
    const micBtn = document.getElementById('chat-mic-btn')

    this.recognition.onstart = () => {
      this.isRecording = true
      micBtn.classList.add('recording')
    }

    this.recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      input.value = transcript
      this._checkHebrew(transcript)
    }

    this.recognition.onend = () => {
      this.isRecording = false
      micBtn.classList.remove('recording')
      this.recognition = null

      if (input.value.trim() && this._containsHebrew(input.value)) {
        this._checkHebrew(input.value)
      }
    }

    this.recognition.onerror = (event) => {
      this.isRecording = false
      micBtn.classList.remove('recording')
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this._addMessage({ system: true, text: 'Voice error: ' + event.error })
      }
      this.recognition = null
    }

    try {
      this.recognition.start()
    } catch (e) {
      this._addMessage({ system: true, text: 'Could not start voice input' })
    }
  },

  stopRecording() {
    if (this.recognition) {
      try { this.recognition.stop() } catch (e) {}
    }
    this.isRecording = false
    const micBtn = document.getElementById('chat-mic-btn')
    if (micBtn) micBtn.classList.remove('recording')
  },
}
