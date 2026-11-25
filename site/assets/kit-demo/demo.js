/*
 * Interactive /repo-bootstrap demo: a scripted chat with phases, tool rows, questions and a
 * composer. No dependencies. The conversation lives in a per-locale script
 * (`assets/demo/<lang>.js`, which sets `window.ArkDemoScript`); this file only plays it.
 *
 *   ArkDemo.mount(element, { avatar: 'assets/logo.svg', terminal: false })
 *
 * Copied from agentic-repo-kit (site/assets/demo.js) plus `autoplay` for this shelf:
 *   ArkDemo.mount(el, { terminal: true, autoplay: { plan: [...], ask: 'Choosing…', done: '…' } })
 * plays on its own: each question takes the plan's answer for that loop (else the recommended or
 * pre-selected one), then the next loop starts. Decorative: not focusable, no pointer events.
 * With reduced motion it plays one fast pass and stops.
 *
 * Without autoplay the visitor answers every question. `terminal: true` gives the terminal look (`$` and `>`
 * prefixes, short labels) used on dark surfaces. Reduced motion skips the typing effects.
 * Playback pauses while the element is off screen.
 */
(function () {
  'use strict'

  var STATUS = { ok: 1, fail: 1, warn: 1, skip: 1, dot: 1, run: 1, quote: 1 }
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    fail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5"/><path d="M12 17h.01"/></svg>',
    skip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    run: '<span class="ad-spin"></span>',
    dot: '<span class="ad-bullet"></span>',
  }
  var SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>'
  var REPLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'

  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  /* Helpers the scripts build their beats with. Colours are names, mapped to CSS classes. */
  var H = {
    C: { ok: 'ok', fail: 'fail', warn: 'warn', info: 'info', dim: 'dim', ink: 'ink' },
    blk: function (kicker) { return { t: 'block', kicker: kicker } },
    say: function (text) { return { t: 'say', text: text } },
    tool: function (tag, text, result, status, ms) { return { t: 'tool', tag: tag, text: text, result: result, status: status || 'ok', ms: ms || 650 } },
    line: function (tag, text, status, color) { return { t: 'row', row: { kind: 'line', status: status || 'dot', tag: tag, text: text, color: color } } },
    quote: function (text, src) { return { t: 'row', row: { kind: 'quote', status: 'quote', text: text, result: src } } },
    par: function (items) { return { t: 'par', items: items } },
    wait: function (ms) { return { t: 'wait', ms: ms } },
    think: function (ms) { return { t: 'typing', ms: ms || 900 } },
    phase: function (p) { return { t: 'phase', p: p } },
  }

  function colorOf(status) { return status === 'fail' ? 'fail' : status === 'warn' ? 'warn' : 'info' }

  function Demo(root, opts) {
    this.root = root
    this.opts = opts || {}
    this.term = !!this.opts.terminal
    this.auto = this.opts.autoplay || null
    this.loop = 0
    this.speed = 1
    this.reduced = false
    try { this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}
    if (this.reduced) this.speed = 0.05
    this.timers = []
    this.held = []
    this.paused = true
    this.build()
    this.reset()
    this.watch()
  }

  Demo.prototype.build = function () {
    this.root.classList.add('ad')
    if (this.auto) { this.root.classList.add('ad--auto'); this.root.setAttribute('aria-hidden', 'true') }
    this.root.innerHTML = ''
    this.phasesEl = el('ol', 'ad-phases')
    this.phasesEl.setAttribute('aria-label', 'Phases')
    this.body = el('div', 'ad-chat')
    this.body.setAttribute('role', 'log')
    this.body.setAttribute('aria-live', 'polite')
    var foot = el('div', 'ad-foot')
    this.composer = el('div', 'ad-composer')
    this.composer.appendChild(el('span', 'ad-prompt', this.term ? '$' : '›'))
    this.composerText = el('span', 'ad-composer-text')
    this.composer.appendChild(this.composerText)
    this.sendEl = el('span', 'ad-send')
    this.sendEl.innerHTML = SEND
    this.sendEl.setAttribute('aria-hidden', 'true')
    foot.appendChild(this.composer)
    foot.appendChild(this.sendEl)
    this.root.appendChild(this.phasesEl)
    this.root.appendChild(this.body)
    this.root.appendChild(foot)
  }

  /* A fresh script instance per run: scripts keep their own state (mode, repo) in closures. */
  Demo.prototype.reset = function () {
    this.clear()
    var factory = window.ArkDemoScript
    if (typeof factory !== 'function') throw new Error('ArkDemo: no script loaded')
    this.s = factory(H)
    this.ui = this.s.ui
    this.answers = {}
    this.done = false
    this.queue = []
    this.running = false
    this.last = null
    this.ask = null
    this.phase = -1
    this.body.innerHTML = ''
    this.typingEl = null
    this.phasesEl.innerHTML = ''
    var self = this
    this.phaseEls = this.s.phases.map(function (label) {
      var li = el('li', 'ad-step', label)
      self.phasesEl.appendChild(li)
      return li
    })
    this.setComposer('')
    this.run(this.s.intro())
  }

  Demo.prototype.watch = function () {
    var self = this
    if (!('IntersectionObserver' in window)) { this.resume(); return }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) self.resume(); else self.pause() })
    }, { threshold: 0.15 }).observe(this.root)
  }

  Demo.prototype.pause = function () { this.paused = true }
  Demo.prototype.resume = function () {
    if (!this.paused) return
    this.paused = false
    var held = this.held
    this.held = []
    held.forEach(function (fn) { fn() })
  }

  Demo.prototype.later = function (fn, ms) {
    var self = this
    var wrapped = function () { if (self.paused) self.held.push(fn); else fn() }
    var id = setTimeout(function () {
      self.timers = self.timers.filter(function (x) { return x !== id })
      wrapped()
    }, Math.max(0, ms * this.speed))
    this.timers.push(id)
  }

  Demo.prototype.clear = function () {
    this.timers.forEach(function (id) { clearTimeout(id) })
    this.timers = []
    this.held = []
    this.queue = []
    this.running = false
  }

  Demo.prototype.run = function (beats) {
    this.queue = this.queue.concat(beats)
    if (!this.running) { this.running = true; this.next() }
  }

  Demo.prototype.scroll = function () { this.body.scrollTop = this.body.scrollHeight }

  Demo.prototype.setComposer = function (text) {
    this.composerText.textContent = text || this.hint()
    this.composer.classList.toggle('is-active', !!text)
    this.composerText.classList.toggle('is-hint', !text)
    this.sendEl.classList.toggle('is-active', !!text)
    this.composing = text
  }

  Demo.prototype.hint = function () {
    if (this.auto) return this.done ? this.auto.done : (this.ask ? this.auto.ask : this.ui.hintWorking)
    if (this.done) return this.ui.hintDone
    if (this.ask) return this.ask.setup ? this.ui.hintSetup : this.ui.hintAsk
    return this.ui.hintWorking
  }

  Demo.prototype.setPhase = function (p) {
    this.phase = p
    this.phaseEls.forEach(function (li, i) {
      li.classList.toggle('is-current', i === p)
      li.classList.toggle('is-past', i < p)
    })
    var cur = this.phaseEls[p]
    if (cur) {
      var target = cur.offsetLeft - (this.phasesEl.clientWidth - cur.offsetWidth) / 2
      try { this.phasesEl.scrollTo({ left: Math.max(0, target), behavior: this.speed < 1 ? 'auto' : 'smooth' }) } catch (e) { this.phasesEl.scrollLeft = Math.max(0, target) }
    }
  }

  Demo.prototype.typing = function (on) {
    if (on && !this.typingEl) {
      var wrap = el('div', 'ad-msg ad-typing')
      wrap.setAttribute('aria-label', this.ui.working)
      if (this.opts.avatar) wrap.appendChild(this.avatar())
      var dots = el('div', 'ad-dots')
      dots.innerHTML = '<span></span><span></span><span></span>'
      wrap.appendChild(dots)
      this.body.appendChild(wrap)
      this.typingEl = wrap
      this.scroll()
    } else if (!on && this.typingEl) {
      this.typingEl.remove()
      this.typingEl = null
    }
  }

  Demo.prototype.avatar = function () {
    var img = el('img', 'ad-avatar')
    img.src = this.opts.avatar
    img.alt = ''
    img.width = 30
    img.height = 30
    return img
  }

  Demo.prototype.addBlock = function (kicker) {
    var wrap = el('div', 'ad-msg ad-agent')
    if (this.opts.avatar) wrap.appendChild(this.avatar())
    var col = el('div', 'ad-agent-col')
    col.appendChild(el('p', 'ad-kicker', (this.term ? '> ' : '') + kicker))
    wrap.appendChild(col)
    this.body.appendChild(wrap)
    this.last = { col: col, rows: null, text: null }
    this.scroll()
  }

  Demo.prototype.rowsBox = function () {
    if (!this.last.rows) {
      this.last.rows = el('div', 'ad-rows')
      if (this.last.text) this.last.col.insertBefore(this.last.rows, this.last.text)
      else this.last.col.appendChild(this.last.rows)
    }
    return this.last.rows
  }

  Demo.prototype.addRow = function (row) {
    var box = this.rowsBox()
    var n
    if (row.kind === 'quote') {
      n = el('div', 'ad-row ad-quote')
      n.appendChild(el('p', 'ad-quote-text', '“' + row.text + '”'))
      n.appendChild(el('p', 'ad-quote-src', row.result))
    } else {
      n = el('div', 'ad-row ad-line')
      var icon = el('span', 'ad-icon')
      var tag = el('span', 'ad-tag', row.tag || '')
      var text = el('span', 'ad-text', row.text)
      var result = el('span', 'ad-result')
      text.appendChild(result)
      n.appendChild(icon)
      n.appendChild(tag)
      n.appendChild(text)
      n._icon = icon
      n._tag = tag
      n._result = result
      this.setRow(n, row.status, row.result, row.color)
    }
    box.appendChild(n)
    this.scroll()
    return n
  }

  Demo.prototype.setRow = function (n, status, result, color) {
    if (!STATUS[status]) status = 'dot'
    n._icon.className = 'ad-icon is-' + status
    n._icon.innerHTML = ICON[status] || ''
    n._tag.className = 'ad-tag c-' + (color || (status === 'ok' ? 'ok' : status === 'skip' ? 'dim' : 'info'))
    n._result.textContent = result ? ' → ' + result : ''
  }

  Demo.prototype.textEl = function () {
    if (!this.last.text) {
      this.last.text = el('p', 'ad-say')
      this.last.col.appendChild(this.last.text)
    }
    return this.last.text
  }

  Demo.prototype.setText = function (text, streaming) {
    var p = this.textEl()
    p.textContent = text
    if (streaming) {
      var caret = el('span', 'ad-caret')
      caret.setAttribute('aria-hidden', 'true')
      p.appendChild(caret)
    }
    this.scroll()
  }

  Demo.prototype.verdict = function (b) {
    var v = el('div', 'ad-verdict')
    var top = el('div', 'ad-verdict-top')
    top.appendChild(el('span', 'ad-verdict-k', this.ui.verdict))
    top.appendChild(el('span', 'ad-verdict-label', b.label))
    var mid = el('div', 'ad-verdict-mid')
    mid.appendChild(el('span', 'ad-verdict-conf', this.ui.confidence + ': ' + b.conf))
    var track = el('div', 'ad-bar-track')
    var bar = el('div', 'ad-bar')
    track.appendChild(bar)
    mid.appendChild(track)
    v.appendChild(top)
    v.appendChild(mid)
    v.appendChild(el('p', 'ad-verdict-note', this.ui.verdictNote))
    if (this.last.text) this.last.col.insertBefore(v, this.last.text)
    else this.last.col.appendChild(v)
    this.scroll()
    this.later(function () { bar.style.width = b.pct + '%' }, 120)
  }

  Demo.prototype.next = function () {
    var self = this
    var b = this.queue.shift()
    if (!b) { this.running = false; return }
    var go = function (ms) { self.later(function () { self.next() }, ms) }

    switch (b.t) {
      case 'wait': return go(b.ms)
      case 'phase': this.setPhase(b.p); return go(0)
      case 'typing':
        this.typing(true)
        return this.later(function () { self.typing(false); self.next() }, b.ms)
      case 'compose': {
        if (this.speed < 1) { this.setComposer(b.text); return go(0) }
        var i = 0
        var step = function () {
          i += 1
          self.setComposer(b.text.slice(0, i))
          if (i < b.text.length) self.later(step, 32)
          else go(260)
        }
        return step()
      }
      case 'send': {
        var msg = el('div', 'ad-msg ad-user')
        var p = el('p', 'ad-user-text')
        if (this.term) {
          var d = el('span', null, '$ ')
          d.setAttribute('aria-hidden', 'true')
          p.appendChild(d)
        }
        p.appendChild(document.createTextNode(this.composing))
        msg.appendChild(p)
        this.body.appendChild(msg)
        this.setComposer('')
        this.scroll()
        return go(350)
      }
      case 'block': this.addBlock(b.kicker); return go(220)
      case 'say': {
        if (this.speed < 1) { this.setText(b.text, false); return go(0) }
        var n = 0
        var tick = function () {
          n = Math.min(b.text.length, n + 3)
          self.setText(b.text.slice(0, n), n < b.text.length)
          if (n < b.text.length) self.later(tick, 14)
          else go(420)
        }
        return tick()
      }
      case 'row': this.addRow(b.row); return go(b.row.kind === 'quote' ? 420 : 300)
      case 'tool': {
        var r = this.addRow({ kind: 'line', status: 'run', tag: b.tag, text: b.text, result: '', color: 'info' })
        return this.later(function () { self.setRow(r, b.status, b.result, colorOf(b.status)); go(160) }, b.ms)
      }
      case 'par': {
        var max = 0
        b.items.forEach(function (it) {
          var r = self.addRow({ kind: 'line', status: 'run', tag: it.tag, text: it.text, result: '', color: 'info' })
          max = Math.max(max, it.ms)
          self.later(function () { self.setRow(r, it.status, it.result, colorOf(it.status)) }, it.ms)
        })
        return go(max + 250)
      }
      case 'verdict': this.verdict(b); return go(1100)
      case 'ask': this.showAsk(b.q); this.running = false; return
      case 'done': this.finish(); this.running = false; return
      default: return go(0)
    }
  }

  Demo.prototype.showAsk = function (q) {
    var self = this
    this.ask = q
    this.sel = {}
    q.options.forEach(function (o) { if (o.sel) self.sel[o.id] = true })
    var box = el('div', 'ad-msg ad-choices' + (this.opts.avatar ? ' has-avatar' : ''))
    box.appendChild(el('p', 'ad-ask-title', (this.term ? '? ' : '') + q.title))
    q.options.forEach(function (o) {
      var c = el('button', 'ad-choice')
      c.type = 'button'
      var mark = el('span', 'ad-mark' + (q.multi ? ' is-multi' : ''))
      mark.innerHTML = ICON.ok
      var txt = el('span', 'ad-choice-text')
      txt.appendChild(el('span', 'ad-choice-label', o.label))
      txt.appendChild(el('span', 'ad-choice-sub', o.sub))
      c.appendChild(mark)
      c.appendChild(txt)
      if (o.rec) c.appendChild(el('span', 'ad-rec', self.term ? self.ui.recShort : self.ui.recommended))
      c._id = o.id
      if (self.auto) c.tabIndex = -1
      c.addEventListener('click', function () {
        if (q.multi) { if (self.sel[o.id]) delete self.sel[o.id]; else self.sel[o.id] = true; self.paintChoices() }
        else self.answer(q, [o.id], o.label)
      })
      box.appendChild(c)
    })
    if (q.multi) {
      var row = el('div', 'ad-go-row')
      var goBtn = el('button', 'ad-go', this.ui.continue)
      goBtn.type = 'button'
      if (self.auto) goBtn.tabIndex = -1
      goBtn.addEventListener('click', function () { self.confirmMulti() })
      row.appendChild(goBtn)
      box.appendChild(row)
      this.goBtn = goBtn
    } else this.goBtn = null
    this.askEl = box
    this.body.appendChild(box)
    this.paintChoices()
    this.setComposer('')
    this.scroll()
    if (this.auto) this.later(function () { self.autoAnswer(q) }, q.id === 'repo' ? 900 : 1700)
  }

  Demo.prototype.autoAnswer = function (q) {
    var self = this
    var plan = this.auto.plan || []
    var pick = (plan[this.loop % Math.max(1, plan.length)] || {})[q.id]
    if (!pick) {
      pick = q.multi
        ? q.options.filter(function (o) { return o.sel }).map(function (o) { return o.id })
        : [(q.options.filter(function (o) { return o.rec })[0] || q.options[0]).id]
    }
    var buttons = this.askEl.querySelectorAll('.ad-choice')
    if (q.multi) {
      this.sel = {}
      pick.forEach(function (id) { self.sel[id] = true })
      this.paintChoices()
      this.later(function () { self.confirmMulti() }, 700)
      return
    }
    Array.prototype.forEach.call(buttons, function (c) { c.classList.toggle('is-selected', c._id === pick[0]) })
    var o = q.options.filter(function (x) { return x.id === pick[0] })[0]
    this.later(function () { self.answer(q, [o.id], o.label) }, 500)
  }

  Demo.prototype.paintChoices = function () {
    var q = this.ask
    var self = this
    var n = 0
    Array.prototype.forEach.call(this.askEl.querySelectorAll('.ad-choice'), function (c) {
      var on = !!(q.multi && self.sel[c._id])
      if (on) n += 1
      c.classList.toggle('is-selected', on)
      c.setAttribute('aria-pressed', q.multi ? String(on) : 'false')
    })
    if (this.goBtn) {
      this.goBtn.disabled = n === 0
    }
  }

  Demo.prototype.confirmMulti = function () {
    var q = this.ask
    var self = this
    var picked = q.options.filter(function (o) { return self.sel[o.id] })
    if (!picked.length) return
    this.answer(q, picked.map(function (o) { return o.id }), picked.map(function (o) { return o.label }).join(', '))
  }

  Demo.prototype.answer = function (q, ids, label) {
    this.answers[q.id] = ids
    this.ask = null
    if (this.askEl) { this.askEl.remove(); this.askEl = null }
    if (q.id === 'repo') { this.run(this.s.start(ids[0])); return }
    this.run([H.wait(150), { t: 'compose', text: label }, { t: 'send' }].concat(this.s.after(q.id, ids, this.answers)))
  }

  Demo.prototype.finish = function () {
    var self = this
    this.done = true
    this.setComposer('')
    if (this.auto) {
      if (!this.reduced) this.later(function () { self.loop += 1; self.restart() }, 3200)
      return
    }
    var wrap = el('div', 'ad-msg ad-replay-row')
    var btn = el('button', 'ad-ghost')
    btn.type = 'button'
    btn.innerHTML = REPLAY
    btn.appendChild(document.createTextNode(this.ui.replay))
    btn.addEventListener('click', function () { self.restart() })
    wrap.appendChild(btn)
    this.body.appendChild(wrap)
    this.scroll()
  }

  Demo.prototype.restart = function () {
    if (this.auto && !this.done) this.loop = 0
    this.done = false
    this.paused = false
    this.reset()
  }

  window.ArkDemo = {
    mount: function (root, opts) {
      var d = new Demo(root, opts)
      var restart = document.querySelector('[data-demo-restart="' + root.id + '"]')
      if (restart) restart.addEventListener('click', function () { d.restart() })
      return d
    },
  }
})()
