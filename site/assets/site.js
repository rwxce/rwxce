// Shelf search, project cards and language switcher. No storage, no network.
(function () {
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)) }
  // Lowercase and strip accents so "construccion" matches "construcción".
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  }

  var input = document.getElementById('q')
  var grid = document.getElementById('apps')
  var items = all('[data-keywords]')
  var empty = document.getElementById('empty')
  var emptyQuery = document.getElementById('empty-q')

  function apply() {
    var raw = input.value
    var q = norm(raw)
    var shown = 0
    items.forEach(function (el) {
      var hit = !q || norm(el.getAttribute('data-keywords')).indexOf(q) >= 0
      el.hidden = !hit
      if (hit) shown++
    })
    grid.hidden = shown === 0
    empty.hidden = shown > 0
    emptyQuery.textContent = raw.trim()
  }

  if (input && grid && empty && emptyQuery) {
    input.addEventListener('input', apply)
    if (input.value) apply()
  }

  // Project cards: one modal dialog, one card visible at a time, previous / next in a loop.
  var sheet = document.getElementById('sheet')
  var cards = all('[data-card]', sheet)
  var keys = cards.map(function (c) { return c.getAttribute('data-card') })
  var steps = all('[data-step]', sheet)
  var count = sheet.querySelector('.sheet-count')
  var current = 0
  var opener = null

  function wrap(i) { return (i + cards.length) % cards.length }
  function pad(n) { return ('00' + n).slice(-3) }

  function show(i) {
    current = wrap(i)
    cards.forEach(function (c, n) { c.hidden = n !== current })
    sheet.setAttribute('aria-labelledby', cards[current].getAttribute('aria-labelledby'))
    count.textContent = pad(current + 1) + ' / ' + pad(cards.length)
    steps.forEach(function (b) {
      var step = Number(b.getAttribute('data-step'))
      var name = cards[wrap(current + step)].getAttribute('data-name')
      b.querySelector('.nav-name').textContent = name
      b.setAttribute('aria-label', sheet.getAttribute(step < 0 ? 'data-prev' : 'data-next') + ': ' + name)
    })
    if (!sheet.open) {
      sheet.showModal()
      document.documentElement.classList.add('sheet-open')
    }
    sheet.scrollTop = 0
    history.replaceState(null, '', '#' + keys[current])
  }

  all('[data-open]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      opener = tile
      show(keys.indexOf(tile.getAttribute('data-open')))
    })
  })
  steps.forEach(function (b) {
    b.addEventListener('click', function () { show(current + Number(b.getAttribute('data-step'))) })
  })
  sheet.querySelector('[data-close]').addEventListener('click', function () { sheet.close() })

  // A click that starts and ends on the scrim (the dialog itself) closes the card.
  var downOnScrim = false
  sheet.addEventListener('pointerdown', function (e) { downOnScrim = e.target === sheet })
  sheet.addEventListener('click', function (e) { if (downOnScrim && e.target === sheet) sheet.close() })

  sheet.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    show(current + (e.key === 'ArrowLeft' ? -1 : 1))
  })

  var touch = null
  sheet.addEventListener('touchstart', function (e) {
    touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
  }, { passive: true })
  sheet.addEventListener('touchend', function (e) {
    if (!touch) return
    var dx = e.changedTouches[0].clientX - touch.x
    var dy = e.changedTouches[0].clientY - touch.y
    touch = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1))
  }, { passive: true })

  sheet.addEventListener('close', function () {
    document.documentElement.classList.remove('sheet-open')
    if (keys.indexOf(location.hash.slice(1)) >= 0) history.replaceState(null, '', location.pathname + location.search)
    var back = opener || document.querySelector('[data-open="' + keys[current] + '"]')
    opener = null
    if (back) back.focus()
  })

  // #zliding, #mascot-studio… open that card; this is what the language switcher carries over.
  function openFromHash() {
    var i = keys.indexOf(location.hash.slice(1))
    if (i >= 0) show(i)
    else if (sheet.open) sheet.close()
  }
  window.addEventListener('hashchange', openFromHash)

  // Scale the fixed-size Zliding illustration to its column (it has no width while the sheet is closed).
  var arts = all('.z-art')
  function fit(el) { if (el.clientWidth) el.style.setProperty('--zs', String(el.clientWidth / 600)) }
  if (arts.length && 'ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target) }) })
    arts.forEach(function (el) { ro.observe(el) })
  }

  // SMIL (the ghost's hem) ignores the CSS reduced-motion rule: pause it by hand.
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    all('.ms-art svg').forEach(function (s) { if (s.pauseAnimations) { s.pauseAnimations(); s.setCurrentTime(0) } })
  }

  // Keep the current hash when switching language.
  all('a[hreflang][data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash)
    })
  })

  openFromHash()
})()
