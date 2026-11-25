/* /repo-bootstrap demo script, Spanish. Played by assets/demo.js. Example data only. */
window.ArkDemoScript = function (h) {
  'use strict'
  var C = h.C, blk = h.blk, say = h.say, tool = h.tool, line = h.line, quote = h.quote, par = h.par, wait = h.wait, think = h.think, phase = h.phase
  var MODE = 'new'
  var REPO = 'new'

  var ui = {
    recommended: 'Recomendada', recShort: 'rec.', continue: 'Continuar', replay: 'Repetir la demo',
    verdict: 'Veredicto', confidence: 'Confianza', verdictNote: 'Confianza en la evidencia, no una probabilidad de éxito.',
    working: 'El agente está trabajando', hintWorking: 'El agente está trabajando…', hintAsk: 'Elige una respuesta arriba',
    hintSetup: 'Elige un repo para empezar la demo', hintDone: 'Demo terminada. Repítela con el otro repo o con otras respuestas.',
  }

  function intro() {
    return [
      wait(300),
      { t: 'ask', q: {
        id: 'repo', title: 'Preparación de la demo · elige un repo', multi: false, setup: true,
        options: [
          { id: 'new', label: 'Un repo nuevo', sub: 'Vacío: sin código ni configuración. Tú traes la idea.' },
          { id: 'existing', label: 'Un repo existente', sub: 'Un SaaS de reservas en producción, con código y un CLAUDE.md antiguo.' },
        ] } },
    ]
  }

  function start(repo) {
    REPO = repo
    if (repo === 'new') {
      return [
        wait(200), { t: 'compose', text: '/repo-bootstrap quiero crear reservas online para clínicas pequeñas de fisioterapia' }, { t: 'send' },
        phase(0), think(800),
        blk('Fase 0 · Escaneo ligero · solo lectura'),
        tool('Glob', '**/*', 'solo .gitignore y un README vacío', 'skip'),
        tool('Bash', 'git log --oneline | wc -l', '1 commit', 'skip'),
        tool('Glob', 'CLAUDE.md · AGENTS.md · .rulesync/', 'ninguno', 'skip'),
        tool('Glob', '.github/workflows/', 'ninguno', 'skip'),
        say('El repo está vacío, así que no hay nada que analizar: es un proyecto nuevo. Todo lo que sé sale de tu mensaje. Confirma el modo; cambia cómo aprendo sobre el producto.'),
        askMode(repo),
      ]
    }
    return [
      wait(200), { t: 'compose', text: '/repo-bootstrap audit' }, { t: 'send' },
      phase(0), think(800),
      blk('Fase 0 · Escaneo ligero · solo lectura'),
      tool('Read', 'package.json', 'framework web, SDK de pagos, ORM, runner de tests'),
      tool('Bash', 'git log --oneline | wc -l', '1.940 commits · 214 ficheros de código'),
      tool('Read', 'CLAUDE.md', '18 KB, editado hace meses', 'warn'),
      tool('Glob', '.github/workflows/', 'ci.yml, deploy.yml'),
      tool('Grep', 'payments|webhook|cron', 'ruta de webhook, 2 crons, página de precios'),
      line('objetivo', 'auditar y mejorar (por el argumento «audit»)', 'ok', C.ok),
      say('Código real, historial real y una configuración de agentes que ha crecido sola: parece un proyecto existente. Confirma el modo; cambia cómo aprendo sobre el repo.'),
      askMode(repo),
    ]
  }

  function askMode(repo) {
    return { t: 'ask', q: {
      id: 'mode', title: 'Pregunta 2 · Modo · preseleccionado por el escaneo', multi: false,
      options: [
        { id: 'new', label: 'Proyecto nuevo / limpio', sub: 'Poco o nada de código. La configuración sale de una entrevista y plantillas.', rec: repo === 'new' },
        { id: 'existing', label: 'Proyecto existente', sub: 'Código que analizar. Cada propuesta cita fichero:línea.', rec: repo === 'existing' },
      ] } }
  }

  function afterMode(mode) {
    if (REPO === 'new' && mode === 'existing') {
      MODE = 'new'
      return [think(600), blk('Modo'), say('Aquí no hay código para las lentes de descubrimiento, así que no devolverían nada. Lo ejecuto como proyecto nuevo y guardo tu elección en choices.md.')].concat(askPurpose())
    }
    MODE = mode
    if (REPO === 'existing' && mode === 'new') {
      return [think(600), blk('Modo · empezar de cero'), say('El código existente se queda como está. La configuración sale de una entrevista y plantillas, y el CLAUDE.md antiguo se audita igualmente bloque a bloque, nunca se descarta por el título.')].concat(askPurpose())
    }
    return askPurpose()
  }

  function askPurpose() {
    var signal = REPO === 'new' ? 'Por tu mensaje: las clínicas son quien compra.' : 'Encontrados un SDK de pagos y una página de precios.'
    return [
      phase(1), think(600),
      blk('Pregunta 0 · Propósito'),
      say('¿Para qué es? Esto decide qué fases se ejecutan.'),
      { t: 'ask', q: {
        id: 'purpose', title: 'Pregunta 0 · Propósito', multi: false,
        options: [
          { id: 'b2b', label: 'Ganar dinero · SaaS B2B', sub: 'Las clínicas pagan por cuenta. ' + signal, rec: true },
          { id: 'b2c', label: 'Ganar dinero · B2C', sub: 'Los pacientes reservan y pagan directamente.' },
          { id: 'app', label: 'Ganar dinero · App', sub: 'App móvil, de pago o por suscripción.' },
          { id: 'own', label: 'Herramienta propia', sub: 'Para mi propia clínica. Se salta investigación, validación, precios y crecimiento.' },
        ] } },
    ]
  }

  function afterPurpose(id) {
    if (MODE === 'existing') return discovery(id)
    if (id === 'own') {
      return [
        phase(2), think(700),
        blk('Guardado en .context/repo-bootstrap/choices.md'),
        line('omitido', 'investigación de la idea (propósito: herramienta propia)', 'skip', C.dim),
        line('omitido', 'validación de mercado · precios · crecimiento', 'skip', C.dim),
        say('Omitido, no borrado. Si el propósito cambia más adelante vuelvo a pasar el menú, y no se quita nada de lo ya generado.'),
      ].concat(askSensitive())
    }
    var variant = id === 'b2b' ? 'webs de reseñas B2B e hilos de compradores' : (id === 'b2c' ? 'foros de consumidores y reseñas de apps' : 'reseñas en las tiendas de apps')
    return [
      phase(2), think(900),
      blk('Fase 1 · Investigación de la idea · antes de cualquier código'),
      say('Antes de cualquier código: ¿merece esta idea el siguiente compromiso? Seis pasos con datos reales, cada hecho con su fuente y la fecha en que se leyó.'),
      tool('Search', 'directorios de productos, tiendas de apps, hosting de código', '7 productos hacen este trabajo', 'ok', 900),
      tool('Read', 'reseñas de 1–3 estrellas · ' + variant, '142 quejas leídas', 'ok', 1000),
      wait(250),
      blk('Competencia de cuatro tipos'),
      line('DIRECT', 'suites de gestión de clínicas con reservas incluidas', 'dot', C.info),
      line('SUBSTITUTE', 'recepción contestando el teléfono', 'dot', C.info),
      line('HOMEMADE', 'un calendario compartido y recordatorios por chat', 'dot', C.info),
      line('CONVERGENCE', 'herramientas de calendario a una función de hacer este trabajo', 'dot', C.info),
      wait(250),
      blk('Grupos de quejas · citas literales, sin usuarios'),
      line('grupo 1', 'ausencias que nadie persigue', 'dot', C.ink),
      quote('La mitad de mis citas del lunes no se presentan y la app no hace nada.', 'web de reseñas · 2★ · leída 2026-11-25'),
      quote('Hay recordatorios, pero los pacientes no pueden cambiar la cita desde ellos.', 'hilo de compradores · leído 2026-11-25'),
      line('grupo 2', 'el precio por profesional castiga a las clínicas pequeñas', 'dot', C.ink),
      quote('Somos dos fisios y pagamos como un hospital.', 'web de reseñas · 1★ · leída 2026-11-25'),
      line('hueco', 'cambiar la cita desde el propio recordatorio; nadie lo hace', 'dot', C.warn),
      wait(300),
      { t: 'verdict', label: 'Probar antes de construir', conf: 'media', pct: 58 },
      say('El experimento más barato: una página de lista de espera para clínicas de uno a tres profesionales, con los umbrales de éxito, fracaso e inconcluso escritos antes. El resultado va al registro de calibración, y las citas alimentan el panel sintético de compradores: hipótesis, nunca decisiones.'),
      { t: 'ask', q: {
        id: 'verdict', title: '¿Y ahora?', multi: false,
        options: [
          { id: 'go', label: 'Seguir con la configuración', sub: 'Lanza el experimento en paralelo. Siguiente: diseño del sistema.', rec: true },
          { id: 'reshape', label: 'Reorientar hacia el hueco', sub: 'Empezar por cambiar la cita desde el recordatorio.' },
          { id: 'park', label: 'Aparcar la idea', sub: 'Guardar la evidencia, no escribir nada más.' },
        ] } },
    ]
  }

  function discovery(purpose) {
    var b = [phase(2), think(800), blk('Fase 1 · Lentes de descubrimiento · subagentes en paralelo, solo lectura')]
    b.push(say('Siete lentes a la vez. Cada una devuelve solo una tabla corta, y cada fila cita fichero:línea.'))
    b.push(par([
      { tag: 'stack', text: 'stack and infrastructure', result: 'framework web, Postgres con un ORM, hosting serverless · package.json:14', status: 'ok', ms: 1100 },
      { tag: 'flows', text: 'dominios sensibles', result: 'pagos, acceso del personal, notas de pacientes · app/api/payments/route.ts:22', status: 'ok', ms: 1500 },
      { tag: 'workflow', text: 'flujo de desarrollo', result: 'la CI solo pasa lint, sin tests en las PR · ci.yml:9', status: 'warn', ms: 1300 },
      { tag: 'services', text: 'servicios externos', result: 'pagos (MCP oficial), email, monitorización de errores', status: 'ok', ms: 1700 },
      { tag: 'code', text: 'código y arquitectura', result: 'la UI importa el cliente de la BD directamente en 11 ficheros', status: 'warn', ms: 1900 },
      { tag: 'config', text: 'auditoría de la configuración de IA existente', result: '3 hechos caducados, 2 reglas en conflicto · CLAUDE.md:48', status: 'fail', ms: 2100 },
      { tag: 'ops', text: 'operations', result: '2 crons sin alerta si fallan', status: 'warn', ms: 1600 },
    ]))
    b.push(line('hecho en casa', 'sesiones hechas a mano · lib/session.ts (420 líneas) → un hallazgo para integrate-before-build, nunca una migración por sí sola', 'warn', C.warn))
    if (purpose === 'own') b.push(line('omitido', 'investigación de la idea · precios · crecimiento (propósito: herramienta propia)', 'skip', C.dim))
    else b.push(line('investigación', 'aquí la investigación de la idea solo se propone para un cambio grande, como un público nuevo', 'skip', C.dim))
    b.push(say('El código tiene un estilo dominante, con algunas excepciones. ¿Cómo lo trato?'))
    b.push({ t: 'ask', q: {
      id: 'style', title: 'Pregunta 5 · Estilo de código', multi: false,
      options: [
        { id: 'follow', label: 'Seguir el estilo existente', sub: 'Codificarlo en el formateador, el lint y las Build rules. Sin tocar el código.', rec: true },
        { id: 'refactor', label: 'Refactor que conserva el comportamiento', sub: 'Un plan aparte: primero tests de caracterización, después PR pequeñas.' },
        { id: 'leave', label: 'Dejarlo como está', sub: 'No tocar nada del estilo.' },
      ] } })
    return b
  }

  function afterStyle(id) {
    var note = id === 'follow' ? 'Medido: comillas simples 94%, sin punto y coma 97%. Las excepciones, listadas con fichero:línea; no se toca ningún fichero.'
      : id === 'refactor' ? 'Un plan de refactor aparte, nunca mezclado con las PR del bootstrap: tests de caracterización, una PR mecánica de formato y después refactors por módulo que demuestran el mismo comportamiento.'
      : 'El estilo se queda como está y se anota en choices.md.'
    return [
      think(600), blk('Fase 2 · Estilo de código'), say(note),
      phase(3), think(900),
      blk('Fase 1b · Diseño del sistema · el real, tal como es'),
      say('En un repo existente documento el diseño que hay de verdad, con evidencia, y escribo ADR solo para las decisiones que pesan.'),
      line('ADR-R1', 'el proveedor de pagos es la fuente de verdad de la facturación · route.ts:22 · lo garantiza un test: verificar, deduplicar, releer', 'ok', C.ok),
      line('ADR-R2', 'acceso comprobado en el middleware · middleware.ts:5 · lo garantiza el lint: ninguna ruta fuera del registro', 'ok', C.ok),
      tool('Risk', 'handler de webhook sin deduplicar', 'route.ts:41, un evento reintentado cobra dos veces', 'fail', 900),
      say('Solo hay migración con un riesgo verificado, alternativas comparadas, un camino reversible y tu go. Ahora, ¿qué profundidad para el resto?'),
    ].concat(askDepth(true))
  }

  function afterVerdict(id) {
    if (id === 'park') {
      return [
        think(700), blk('Aparcada'),
        line('guardado', '.context/research/idea-2026-11-25.md · sources and dates', 'ok', C.ok),
        say('Aparcada con toda la evidencia. No se ha escrito nada más. Puedes volver cuando el experimento tenga resultado.'),
        { t: 'done' },
      ]
    }
    var pre = id === 'reshape'
      ? [think(600), blk('Reorientada'), say('El posicionamiento ahora empieza por cambiar la cita desde el recordatorio. Actualizo el brief y guardo las citas que lo respaldan.')]
      : []
    return pre.concat(askSensitive())
  }

  function askSensitive() {
    return [
      think(700),
      blk('Fase 1 · Entrevista · una pregunta cada vez'),
      say('¿Qué dominios sensibles tocará? Deciden la profundidad del diseño del sistema y qué conceptos aplican.'),
      { t: 'ask', q: {
        id: 'sensitive', title: 'Dominios sensibles · elige los que quieras', multi: true,
        options: [
          { id: 'money', label: 'Pagos', sub: 'Suscripciones, pagos con tarjeta, devoluciones.', sel: true },
          { id: 'auth', label: 'Cuentas y acceso', sub: 'Personal de la clínica, roles, acceso de pacientes.', sel: true },
          { id: 'data', label: 'Datos de salud y personales', sub: 'Nombres de pacientes, notas, citas.', sel: true },
          { id: 'jobs', label: 'Crons y webhooks', sub: 'Recordatorios, callbacks de proveedores.' },
        ] } },
    ]
  }

  function askDepth(rec) {
    return [{ t: 'ask', q: {
      id: 'depth', title: 'Pregunta 6 · Profundidad', multi: false,
      options: [
        { id: 'full', label: 'Completa', sub: 'Añade un benchmark de una feature grande en contextos limpios. Unos 200–300k tokens más.', rec: rec },
        { id: 'quick', label: 'Rápida', sub: 'Propuesta a partir del descubrimiento y el catálogo. Unos 60–120k tokens.', rec: !rec },
      ] } }]
  }

  function afterSensitive(sel) {
    var size = sel.length >= 3 ? 'a fondo' : (sel.length >= 1 ? 'estándar' : 'ligero')
    var b = [
      phase(3), think(900),
      blk('Fase 1b · Diseño del sistema · tamaño ' + size),
      say('Primero requisitos, fronteras de confianza y riesgos. Después de dos a cuatro alternativas para cada decisión abierta, comparadas con criterios que cualquiera puede comprobar.'),
      tool('Compare', 'auth: hecha en casa vs proveedor gestionado', 'gestionado (licencia, CVE de la versión exacta, coste modelado)', 'ok', 900),
    ]
    if (sel.indexOf('money') >= 0) b.push(line('ADR-001', 'pagos por webhooks del proveedor · lo garantiza un test: verificar, deduplicar, releer', 'ok', C.ok))
    if (sel.indexOf('auth') >= 0) b.push(line('ADR-002', 'acceso comprobado en la frontera de los datos · lo garantiza el lint', 'ok', C.ok))
    if (sel.indexOf('data') >= 0) b.push(line('ADR-003', 'datos de pacientes cifrados, restauración probada cada mes · lo garantiza la CI', 'ok', C.ok))
    if (sel.indexOf('jobs') >= 0) b.push(line('ADR-004', 'recordatorios como jobs duraderos con reintentos · lo garantiza un test', 'ok', C.ok))
    b.push(line('descartado', 'transactional outbox · encaja su «cuándo no»: una base de datos, sin cola', 'skip', C.dim))
    b.push(say('Cada ADR nombra la comprobación que la garantiza, y en un proyecto nuevo el diseño también espera tu go. Ahora, ¿qué profundidad para el resto?'))
    return b.concat(askDepth(sel.length > 0))
  }

  function afterDepth(id) {
    var b = []
    if (id === 'full') {
      b = b.concat([
        think(800),
        blk('Fase 3 · Benchmark · contextos limpios'),
        say('Una feature transversal inventada: cuentas familiares con facturación compartida. Tres planificadores, solo lectura, cada uno debe listar qué se rompería.'),
        par([
          { tag: 'Planner A', text: 'sin protocolo', result: '4 de 18 efectos laterales', status: 'warn', ms: 1200 },
          { tag: 'Planner B', text: 'sin protocolo', result: '6 de 18 efectos laterales', status: 'warn', ms: 1500 },
          { tag: 'Planner C', text: 'con el protocolo de planificación', result: '17 de 18 efectos laterales', status: 'ok', ms: 1900 },
        ]),
        say('La lista unida de 18 inicia el registro de efectos laterales. Un protocolo escrito gana a un modelo más grande.'),
      ])
    }
    return b.concat([
      phase(4), think(700),
      blk('Pregunta 9 · Módulos de producto'),
      say((REPO === 'new' ? 'La entrevista' : 'El escaneo') + ' ha encontrado señales para estos módulos. Elige los que quieras; cada uno trae sus propias comprobaciones.'),
      { t: 'ask', q: {
        id: 'modules', title: 'Módulos de producto · elige los que quieras', multi: true,
        options: [
          { id: 'ops', label: 'Operaciones', sub: 'Auditoría de infra, monitorización, alertas críticas, límites de proveedores, automatizaciones portables.', sel: true, rec: true },
          { id: 'brand', label: 'Marca', sub: 'Nombre, logo, paleta 60-30-10, comprobación de contraste.' },
          { id: 'stack', label: 'Stack + pruebas de carga', sub: 'Perfil de stack y k6, nunca contra producción.' },
          { id: 'legal', label: 'Legal', sub: 'Evidencia y preguntas para el fundador, nunca texto legal final.' },
        ] } },
    ])
  }

  function moduleBeats(m) {
    if (m === 'ops' && MODE === 'existing') return [
      think(700), blk('Operaciones · infra-audit · solo lectura'),
      par([
        { tag: 'MCP GET', text: 'registros DNS', result: 'CNAME old.clinicbook.app apunta a un host borrado', status: 'fail', ms: 1100 },
        { tag: 'MCP GET', text: 'autenticación de email', result: 'SPF y DKIM bien, DMARC p=none', status: 'warn', ms: 1300 },
        { tag: 'MCP GET', text: 'buckets', result: 'ninguno público', status: 'ok', ms: 900 },
      ]),
      line('limits', 'el job de recordatorios arranca todas las clínicas en el mismo minuto, sin paginar · 3 colas comparten un límite de concurrencia y lo superan entre todas', 'warn', C.warn),
      line('alert', 'fallos del webhook de pagos → alerta por chat, email de respaldo, sin datos personales', 'dot', C.info),
      line('heartbeat', 'los dos crons dan señal; un ciclo en silencio lanza una alerta', 'dot', C.info),
      line('automation', 'una spec → GitHub Actions, Orca o Claude Code; la clave del agente nunca comparte job con un token de escritura', 'dot', C.info),
      say('La auditoría no arregla nada: un registro colgado es un secuestro de subdominio esperando a pasar, así que te llega como pasos en el panel. Los límites van al registro, cada uno con su tope de gasto y qué pasa al llegar.'),
    ]
    if (m === 'ops') return [
      think(700), blk('Operaciones · planificadas antes del lanzamiento'),
      line('health', 'health check y uptime desde el primer deploy', 'dot', C.info),
      line('limits', 'cada límite del plan gratuito en el registro: aviso al 70%, escala sola solo bajo un tope de gasto, se degrada en el tope', 'dot', C.info),
      line('alert', 'fallos de pago → alerta por chat, email de respaldo, sin datos personales', 'dot', C.info),
      line('infra-audit', 'mensual, solo lectura con el MCP del proveedor', 'dot', C.info),
      line('checklist', 'preparación para producción · 20 puntos, del rollback a los límites de gasto', 'dot', C.info),
      say('Aún no se ejecuta nada contra producción: la checklist cierra el paso al primer lanzamiento.'),
    ]
    if (m === 'brand') return [
      think(700), blk('Paso de marca'),
      tool('Check', 'nombres candidatos · dominios y marcas', 'quedan 3 de 12', 'ok', 900),
      tool('Contrast', 'blanco sobre #FF7058', '2,72:1, no pasa WCAG 2.2 AA', 'fail', 700),
      tool('Contrast', '#0E1130 sobre #FF7058', '6,8:1, pasa', 'ok', 700),
      say('Tres direcciones de color con capturas a 1440 y 390. No se implementa nada hasta que elijas una.'),
    ]
    if (m === 'stack') return [
      think(700), blk('Módulo de stack · pruebas de carga'),
      line('profile', 'stack por entorno: dev, stage, prod', 'dot', C.info),
      tool('k6', 'staging.clinicbook.app', 'en stageHosts, permitido', 'ok', 700),
      tool('k6', 'api.clinicbook.app', 'en prodHosts, rechazado', 'fail', 700),
      say('La guarda de producción falla cerrada: con hosts de ejemplo lo rechaza todo.'),
    ]
    return [
      think(700), blk('Legal · primero la evidencia'),
      line('processors', 'proveedor de pagos, proveedor de email, hosting', 'dot', C.info),
      line('discrepancia', 'la página de privacidad dice «sin terceros» y el código envía emails con un proveedor', 'warn', C.warn),
      line('pregunta', '¿cuánto tiempo guardas las notas de pacientes? → fundador', 'dot', C.ink),
      say('Preguntas para ti y borradores marcados como borradores para un abogado. Ningún texto legal final.'),
    ]
  }

  function afterModules(sel) {
    var b = []
    sel.forEach(function (m) { b = b.concat(moduleBeats(m)) })
    b = b.concat([phase(5), think(900), blk('Fase 4 · Propuesta · cada decisión se convierte en una comprobación')])
    if (MODE === 'existing') b.push(line('audit', 'CLAUDE.md: cada bloque como mantener / reescribir / quitar con un motivo, enseñado antes de escribir', 'ok', C.ok))
    return b.concat([
      line('rules', 'plan antes del código, primero la documentación, registro de decisiones → CLAUDE.md', 'ok', C.ok),
      line('hooks', 'bloquear force-push a main, preguntar antes de cualquier escritura hacia fuera', 'ok', C.ok),
      line('lint', MODE === 'existing' ? 'nada de cliente de BD en el código de UI (11 infracciones listadas)' : 'fronteras entre capas, ningún SDK directo fuera de su pasarela', 'ok', C.ok),
      line('tests', MODE === 'existing' ? 'el test de deduplicación del webhook falla hoy, a propósito' : 'el registro de rutas coincide con el sistema de ficheros', 'ok', C.ok),
      line('CI', 'config sincronizada, tests en cada PR, puerta de plan-folder, pins por SHA completo', 'ok', C.ok),
      line('perms', 'denegar secretos, preguntar antes de publicar o desplegar', 'ok', C.ok),
      say('Cada fila cita su evidencia, y lo que no tenía señal ha ido a una lista de Más adelante. Aún no se ha escrito nada.'),
      { t: 'ask', q: {
        id: 'go', title: 'Pregunta 7 · Salida', multi: false,
        options: [
          { id: 'go', label: 'Go', sub: 'Generarlo como pull requests, una por familia.', rec: true },
          { id: 'proposal', label: 'Solo la propuesta', sub: 'Parar aquí para que pueda leerla y cambiarla.' },
        ] } },
    ])
  }

  var MOD_PR = { ops: 'operaciones: monitorización, alertas, límites de proveedores, infra-audit', brand: 'paso de marca: DESIGN.md, comprobación de contraste', stack: 'perfil de stack, k6 con guarda de producción', legal: 'legal: inventario de evidencia, preguntas al fundador' }

  function afterGo(id, mods) {
    if (id === 'proposal') return [
      think(700), blk('Parado tras la fase 4'),
      line('file', '.context/repo-bootstrap/proposal.md', 'ok', C.ok),
      line('file', '.context/repo-bootstrap/choices.md', 'ok', C.ok),
      say('Cambia lo que quieras y di go cuando te parezca bien.'),
      { t: 'done' },
    ]
    var prs = (MODE === 'existing' ? ['auditoría de CLAUDE.md + reglas raíz', 'hooks + permisos'] : ['reglas raíz + hooks + permisos'])
      .concat(['lint + tests de arquitectura', 'CI']).concat(mods.map(function (m) { return MOD_PR[m] }))
    var items = prs.map(function (p, i) { return { tag: 'PR #' + (i + 1), text: p, result: 'abierta', status: 'ok', ms: 900 + i * 350 } })
    return [phase(6), think(700), blk('Fase 5 · Generar · subagentes en paralelo'), par(items),
      blk('Fase 6 · Verificar'),
      tool('hook', 'git push --force origin main', 'bloqueado', 'ok', 700),
      tool('CI', 'cada PR', 'en verde', 'ok', 900),
      line('reflect', 'instalado: tu próxima corrección se convierte en una regla y una comprobación', 'ok', C.ok),
      say('Hecho. Cada guardarraíl se ha ejecutado una vez contra algo real antes de darlo por terminado.'),
      { t: 'done' },
    ]
  }

  return {
    phases: ['Scan', 'Propósito', 'Entender', 'Diseño', 'Módulos', 'Propuesta', 'Go'],
    ui: ui,
    intro: intro,
    start: start,
    after: function (id, ids, a) {
      if (id === 'mode') return afterMode(ids[0])
      if (id === 'style') return afterStyle(ids[0])
      if (id === 'purpose') return afterPurpose(ids[0])
      if (id === 'verdict') return afterVerdict(ids[0])
      if (id === 'sensitive') return afterSensitive(ids)
      if (id === 'depth') return afterDepth(ids[0])
      if (id === 'modules') return afterModules(ids)
      if (id === 'go') return afterGo(ids[0], a.modules || [])
      return []
    },
  }
}
