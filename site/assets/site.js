// Shelf search filter and language switcher. No storage, no network.
(function () {
  // Lowercase and strip accents so "construccion" matches "construcción".
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  }

  var input = document.getElementById('q')
  var plates = Array.prototype.slice.call(document.querySelectorAll('[data-keywords]'))
  var next = document.getElementById('plate-next')
  var empty = document.getElementById('empty')
  var emptyQuery = document.getElementById('empty-q')

  function apply() {
    var raw = input.value
    var q = norm(raw)
    var shown = 0
    plates.forEach(function (el) {
      var hit = !q || norm(el.getAttribute('data-keywords')).indexOf(q) >= 0
      el.hidden = !hit
      if (hit) shown++
    })
    if (next) next.hidden = !!q
    empty.hidden = !q || shown > 0
    emptyQuery.textContent = raw.trim()
  }

  if (input && empty && emptyQuery) {
    input.addEventListener('input', apply)
    if (input.value) apply()
  }

  // Keep the current hash when switching language.
  document.querySelectorAll('a[hreflang][data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash)
    })
  })
})()
