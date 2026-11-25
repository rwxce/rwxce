/* /repo-bootstrap demo script, Catalan. Played by assets/demo.js. Example data only. */
window.ArkDemoScript = function (h) {
  'use strict'
  var C = h.C, blk = h.blk, say = h.say, tool = h.tool, line = h.line, quote = h.quote, par = h.par, wait = h.wait, think = h.think, phase = h.phase
  var MODE = 'new'
  var REPO = 'new'

  var ui = {
    recommended: 'Recomanada', recShort: 'rec.', continue: 'Continua', replay: 'Torna a fer la demo',
    verdict: 'Veredicte', confidence: 'Confiança', verdictNote: 'Confiança en l’evidència, no una probabilitat d’èxit.',
    working: 'L’agent està treballant', hintWorking: 'L’agent està treballant…', hintAsk: 'Tria una resposta a dalt',
    hintSetup: 'Tria un repo per començar la demo', hintDone: 'Demo acabada. Torna-la a fer amb l’altre repo o amb altres respostes.',
  }

  function intro() {
    return [
      wait(300),
      { t: 'ask', q: {
        id: 'repo', title: 'Preparació de la demo · tria un repo', multi: false, setup: true,
        options: [
          { id: 'new', label: 'Un repo nou', sub: 'Buit: sense codi ni configuració. Tu hi poses la idea.' },
          { id: 'existing', label: 'Un repo existent', sub: 'Un SaaS de reserves en producció, amb codi i un CLAUDE.md antic.' },
        ] } },
    ]
  }

  function start(repo) {
    REPO = repo
    if (repo === 'new') {
      return [
        wait(200), { t: 'compose', text: '/repo-bootstrap vull fer reserves en línia per a clíniques petites de fisioteràpia' }, { t: 'send' },
        phase(0), think(800),
        blk('Fase 0 · Escaneig lleuger · només lectura'),
        tool('Glob', '**/*', 'només .gitignore i un README buit', 'skip'),
        tool('Bash', 'git log --oneline | wc -l', '1 commit', 'skip'),
        tool('Glob', 'CLAUDE.md · AGENTS.md · .rulesync/', 'cap', 'skip'),
        tool('Glob', '.github/workflows/', 'cap', 'skip'),
        say('El repo és buit, així que no hi ha res a analitzar: és un projecte nou. Tot el que sé surt del teu missatge. Confirma el mode; canvia com aprenc sobre el producte.'),
        askMode(repo),
      ]
    }
    return [
      wait(200), { t: 'compose', text: '/repo-bootstrap audit' }, { t: 'send' },
      phase(0), think(800),
      blk('Fase 0 · Escaneig lleuger · només lectura'),
      tool('Read', 'package.json', 'framework web, SDK de pagaments, ORM, runner de tests'),
      tool('Bash', 'git log --oneline | wc -l', '1.940 commits · 214 fitxers de codi'),
      tool('Read', 'CLAUDE.md', '18 KB, editat fa mesos', 'warn'),
      tool('Glob', '.github/workflows/', 'ci.yml, deploy.yml'),
      tool('Grep', 'payments|webhook|cron', 'ruta de webhook, 2 crons, pàgina de preus'),
      line('objectiu', 'auditar i millorar (per l’argument «audit»)', 'ok', C.ok),
      say('Codi real, historial real i una configuració d’agents que ha crescut tota sola: sembla un projecte existent. Confirma el mode; canvia com aprenc sobre el repo.'),
      askMode(repo),
    ]
  }

  function askMode(repo) {
    return { t: 'ask', q: {
      id: 'mode', title: 'Pregunta 2 · Mode · preseleccionat per l’escaneig', multi: false,
      options: [
        { id: 'new', label: 'Projecte nou / net', sub: 'Poc o gens de codi. La configuració surt d’una entrevista i plantilles.', rec: repo === 'new' },
        { id: 'existing', label: 'Projecte existent', sub: 'Codi per analitzar. Cada proposta cita fitxer:línia.', rec: repo === 'existing' },
      ] } }
  }

  function afterMode(mode) {
    if (REPO === 'new' && mode === 'existing') {
      MODE = 'new'
      return [think(600), blk('Mode'), say('Aquí no hi ha codi per a les lents de descobriment, així que no tornarien res. L’executo com a projecte nou i guardo la teva tria a choices.md.')].concat(askPurpose())
    }
    MODE = mode
    if (REPO === 'existing' && mode === 'new') {
      return [think(600), blk('Mode · començar de zero'), say('El codi existent es queda com està. La configuració surt d’una entrevista i plantilles, i el CLAUDE.md antic s’audita igualment bloc a bloc, mai es descarta pel títol.')].concat(askPurpose())
    }
    return askPurpose()
  }

  function askPurpose() {
    var signal = REPO === 'new' ? 'Pel teu missatge: les clíniques són qui compra.' : 'Trobats un SDK de pagaments i una pàgina de preus.'
    return [
      phase(1), think(600),
      blk('Pregunta 0 · Propòsit'),
      say('Per a què és? Això decideix quines fases s’executen.'),
      { t: 'ask', q: {
        id: 'purpose', title: 'Pregunta 0 · Propòsit', multi: false,
        options: [
          { id: 'b2b', label: 'Guanyar diners · SaaS B2B', sub: 'Les clíniques paguen per compte. ' + signal, rec: true },
          { id: 'b2c', label: 'Guanyar diners · B2C', sub: 'Els pacients reserven i paguen directament.' },
          { id: 'app', label: 'Guanyar diners · App', sub: 'App mòbil, de pagament o per subscripció.' },
          { id: 'own', label: 'Eina pròpia', sub: 'Per a la meva clínica. Se salta recerca, validació, preus i creixement.' },
        ] } },
    ]
  }

  function afterPurpose(id) {
    if (MODE === 'existing') return discovery(id)
    if (id === 'own') {
      return [
        phase(2), think(700),
        blk('Desat a .context/repo-bootstrap/choices.md'),
        line('omès', 'recerca de la idea (propòsit: eina pròpia)', 'skip', C.dim),
        line('omès', 'validació de mercat · preus · creixement', 'skip', C.dim),
        say('Omès, no esborrat. Si més endavant canvia el propòsit torno a passar el menú, i no es treu res del que ja s’ha generat.'),
      ].concat(askSensitive())
    }
    var variant = id === 'b2b' ? 'webs de ressenyes B2B i fils de compradors' : (id === 'b2c' ? 'fòrums de consumidors i ressenyes d’apps' : 'ressenyes a les botigues d’apps')
    return [
      phase(2), think(900),
      blk('Fase 1 · Recerca de la idea · abans de cap codi'),
      say('Abans de cap codi: es mereix aquesta idea el següent compromís? Sis passos amb dades reals, cada fet amb la seva font i la data en què es va llegir.'),
      tool('Search', 'directoris de productes, botigues d’apps, allotjament de codi', '7 productes fan aquesta feina', 'ok', 900),
      tool('Read', 'ressenyes d’1–3 estrelles · ' + variant, '142 queixes llegides', 'ok', 1000),
      wait(250),
      blk('Competència de quatre tipus'),
      line('DIRECT', 'suites de gestió de clíniques amb reserves incloses', 'dot', C.info),
      line('SUBSTITUTE', 'recepció contestant el telèfon', 'dot', C.info),
      line('HOMEMADE', 'un calendari compartit i recordatoris per xat', 'dot', C.info),
      line('CONVERGENCE', 'eines de calendari a una funció de fer aquesta feina', 'dot', C.info),
      wait(250),
      blk('Grups de queixes · cites literals, sense usuaris'),
      line('grup 1', 'absències que ningú no persegueix', 'dot', C.ink),
      quote('La meitat de les meves cites del dilluns no es presenten i l’app no hi fa res.', 'web de ressenyes · 2★ · llegida 2026-11-25'),
      quote('Hi ha recordatoris, però els pacients no poden canviar la cita des d’ells.', 'fil de compradors · llegit 2026-11-25'),
      line('grup 2', 'el preu per professional castiga les clíniques petites', 'dot', C.ink),
      quote('Som dos fisios i paguem com un hospital.', 'web de ressenyes · 1★ · llegida 2026-11-25'),
      line('forat', 'canviar la cita des del mateix recordatori; ningú no ho fa', 'dot', C.warn),
      wait(300),
      { t: 'verdict', label: 'Provar abans de construir', conf: 'mitjana', pct: 58 },
      say('L’experiment més barat: una pàgina de llista d’espera per a clíniques d’un a tres professionals, amb els llindars d’èxit, fracàs i no concloent escrits abans. El resultat va al registre de calibratge, i les cites alimenten el panell sintètic de compradors: hipòtesis, mai decisions.'),
      { t: 'ask', q: {
        id: 'verdict', title: 'I ara?', multi: false,
        options: [
          { id: 'go', label: 'Continuar amb la configuració', sub: 'Llança l’experiment en paral·lel. Següent: disseny del sistema.', rec: true },
          { id: 'reshape', label: 'Reorientar cap al forat', sub: 'Començar per canviar la cita des del recordatori.' },
          { id: 'park', label: 'Aparcar la idea', sub: 'Guardar l’evidència, no escriure res més.' },
        ] } },
    ]
  }

  function discovery(purpose) {
    var b = [phase(2), think(800), blk('Fase 1 · Lents de descobriment · subagents en paral·lel, només lectura')]
    b.push(say('Set lents alhora. Cadascuna torna només una taula curta, i cada fila cita fitxer:línia.'))
    b.push(par([
      { tag: 'stack', text: 'stack and infrastructure', result: 'framework web, Postgres amb un ORM, allotjament serverless · package.json:14', status: 'ok', ms: 1100 },
      { tag: 'flows', text: 'dominis sensibles', result: 'pagaments, accés del personal, notes de pacients · app/api/payments/route.ts:22', status: 'ok', ms: 1500 },
      { tag: 'workflow', text: 'flux de desenvolupament', result: 'la CI només passa lint, sense tests a les PR · ci.yml:9', status: 'warn', ms: 1300 },
      { tag: 'services', text: 'serveis externs', result: 'pagaments (MCP oficial), correu, monitoratge d’errors', status: 'ok', ms: 1700 },
      { tag: 'code', text: 'codi i arquitectura', result: 'la UI importa el client de la BD directament en 11 fitxers', status: 'warn', ms: 1900 },
      { tag: 'config', text: 'auditoria de la configuració d’IA existent', result: '3 fets caducats, 2 regles en conflicte · CLAUDE.md:48', status: 'fail', ms: 2100 },
      { tag: 'ops', text: 'operations', result: '2 crons sense alerta si fallen', status: 'warn', ms: 1600 },
    ]))
    b.push(line('fet a casa', 'sessions fetes a mà · lib/session.ts (420 línies) → una troballa per a integrate-before-build, mai una migració per si sola', 'warn', C.warn))
    if (purpose === 'own') b.push(line('omès', 'recerca de la idea · preus · creixement (propòsit: eina pròpia)', 'skip', C.dim))
    else b.push(line('recerca', 'aquí la recerca de la idea només es proposa per a un canvi gran, com un públic nou', 'skip', C.dim))
    b.push(say('El codi té un estil dominant, amb algunes excepcions. Com el tracto?'))
    b.push({ t: 'ask', q: {
      id: 'style', title: 'Pregunta 5 · Estil de codi', multi: false,
      options: [
        { id: 'follow', label: 'Seguir l’estil existent', sub: 'Codificar-lo al formatador, al lint i a les Build rules. Sense tocar el codi.', rec: true },
        { id: 'refactor', label: 'Refactor que conserva el comportament', sub: 'Un pla a part: primer tests de caracterització, després PR petites.' },
        { id: 'leave', label: 'Deixar-lo com està', sub: 'No tocar res de l’estil.' },
      ] } })
    return b
  }

  function afterStyle(id) {
    var note = id === 'follow' ? 'Mesurat: cometes simples 94%, sense punt i coma 97%. Les excepcions, llistades amb fitxer:línia; no es toca cap fitxer.'
      : id === 'refactor' ? 'Un pla de refactor a part, mai barrejat amb les PR del bootstrap: tests de caracterització, una PR mecànica de format i després refactors per mòdul que demostren el mateix comportament.'
      : 'L’estil es queda com està i s’anota a choices.md.'
    return [
      think(600), blk('Fase 2 · Estil de codi'), say(note),
      phase(3), think(900),
      blk('Fase 1b · Disseny del sistema · el real, tal com és'),
      say('En un repo existent documento el disseny que hi ha de debò, amb evidència, i escric ADR només per a les decisions que pesen.'),
      line('ADR-R1', 'el proveïdor de pagaments és la font de veritat de la facturació · route.ts:22 · ho garanteix un test: verificar, deduplicar, rellegir', 'ok', C.ok),
      line('ADR-R2', 'accés comprovat al middleware · middleware.ts:5 · ho garanteix el lint: cap ruta fora del registre', 'ok', C.ok),
      tool('Risk', 'handler de webhook sense deduplicar', 'route.ts:41, un esdeveniment reintentat cobra dues vegades', 'fail', 900),
      say('Només hi ha migració amb un risc verificat, alternatives comparades, un camí reversible i el teu go. Ara, quina profunditat per a la resta?'),
    ].concat(askDepth(true))
  }

  function afterVerdict(id) {
    if (id === 'park') {
      return [
        think(700), blk('Aparcada'),
        line('desat', '.context/research/idea-2026-11-25.md · sources and dates', 'ok', C.ok),
        say('Aparcada amb tota l’evidència. No s’ha escrit res més. Hi pots tornar quan l’experiment tingui resultat.'),
        { t: 'done' },
      ]
    }
    var pre = id === 'reshape'
      ? [think(600), blk('Reorientada'), say('El posicionament ara comença per canviar la cita des del recordatori. Actualitzo el brief i guardo les cites que el sostenen.')]
      : []
    return pre.concat(askSensitive())
  }

  function askSensitive() {
    return [
      think(700),
      blk('Fase 1 · Entrevista · una pregunta cada cop'),
      say('Quins dominis sensibles tocarà? Decideixen la profunditat del disseny del sistema i quins conceptes s’hi apliquen.'),
      { t: 'ask', q: {
        id: 'sensitive', title: 'Dominis sensibles · tria els que vulguis', multi: true,
        options: [
          { id: 'money', label: 'Pagaments', sub: 'Subscripcions, pagaments amb targeta, devolucions.', sel: true },
          { id: 'auth', label: 'Comptes i accés', sub: 'Personal de la clínica, rols, accés de pacients.', sel: true },
          { id: 'data', label: 'Dades de salut i personals', sub: 'Noms de pacients, notes, cites.', sel: true },
          { id: 'jobs', label: 'Crons i webhooks', sub: 'Recordatoris, callbacks de proveïdors.' },
        ] } },
    ]
  }

  function askDepth(rec) {
    return [{ t: 'ask', q: {
      id: 'depth', title: 'Pregunta 6 · Profunditat', multi: false,
      options: [
        { id: 'full', label: 'Completa', sub: 'Afegeix un benchmark d’una feature gran en contextos nets. Uns 200–300k tokens més.', rec: rec },
        { id: 'quick', label: 'Ràpida', sub: 'Proposta a partir del descobriment i el catàleg. Uns 60–120k tokens.', rec: !rec },
      ] } }]
  }

  function afterSensitive(sel) {
    var size = sel.length >= 3 ? 'a fons' : (sel.length >= 1 ? 'estàndard' : 'lleuger')
    var b = [
      phase(3), think(900),
      blk('Fase 1b · Disseny del sistema · mida ' + size),
      say('Primer requisits, fronteres de confiança i riscos. Després de dues a quatre alternatives per a cada decisió oberta, comparades amb criteris que qualsevol pot comprovar.'),
      tool('Compare', 'auth: feta a casa vs proveïdor gestionat', 'gestionat (llicència, CVE de la versió exacta, cost modelat)', 'ok', 900),
    ]
    if (sel.indexOf('money') >= 0) b.push(line('ADR-001', 'pagaments per webhooks del proveïdor · ho garanteix un test: verificar, deduplicar, rellegir', 'ok', C.ok))
    if (sel.indexOf('auth') >= 0) b.push(line('ADR-002', 'accés comprovat a la frontera de les dades · ho garanteix el lint', 'ok', C.ok))
    if (sel.indexOf('data') >= 0) b.push(line('ADR-003', 'dades de pacients xifrades, restauració provada cada mes · ho garanteix la CI', 'ok', C.ok))
    if (sel.indexOf('jobs') >= 0) b.push(line('ADR-004', 'recordatoris com a jobs duradors amb reintents · ho garanteix un test', 'ok', C.ok))
    b.push(line('descartat', 'transactional outbox · hi encaixa el seu «quan no»: una base de dades, sense cua', 'skip', C.dim))
    b.push(say('Cada ADR anomena la comprovació que la garanteix, i en un projecte nou el disseny també espera el teu go. Ara, quina profunditat per a la resta?'))
    return b.concat(askDepth(sel.length > 0))
  }

  function afterDepth(id) {
    var b = []
    if (id === 'full') {
      b = b.concat([
        think(800),
        blk('Fase 3 · Benchmark · contextos nets'),
        say('Una feature transversal inventada: comptes familiars amb facturació compartida. Tres planificadors, només lectura, cadascun ha de llistar què es trencaria.'),
        par([
          { tag: 'Planner A', text: 'sense protocol', result: '4 de 18 efectes laterals', status: 'warn', ms: 1200 },
          { tag: 'Planner B', text: 'sense protocol', result: '6 de 18 efectes laterals', status: 'warn', ms: 1500 },
          { tag: 'Planner C', text: 'amb el protocol de planificació', result: '17 de 18 efectes laterals', status: 'ok', ms: 1900 },
        ]),
        say('La llista unida de 18 inicia el registre d’efectes laterals. Un protocol escrit guanya un model més gran.'),
      ])
    }
    return b.concat([
      phase(4), think(700),
      blk('Pregunta 9 · Mòduls de producte'),
      say((REPO === 'new' ? 'L’entrevista' : 'L’escaneig') + ' ha trobat senyals per a aquests mòduls. Tria els que vulguis; cadascun porta les seves comprovacions.'),
      { t: 'ask', q: {
        id: 'modules', title: 'Mòduls de producte · tria els que vulguis', multi: true,
        options: [
          { id: 'ops', label: 'Operacions', sub: 'Auditoria d’infra, monitoratge, alertes crítiques, límits de proveïdors, automatitzacions portables.', sel: true, rec: true },
          { id: 'brand', label: 'Marca', sub: 'Nom, logo, paleta 60-30-10, comprovació de contrast.' },
          { id: 'stack', label: 'Stack + proves de càrrega', sub: 'Perfil de stack i k6, mai contra producció.' },
          { id: 'legal', label: 'Legal', sub: 'Evidència i preguntes per al fundador, mai text legal final.' },
        ] } },
    ])
  }

  function moduleBeats(m) {
    if (m === 'ops' && MODE === 'existing') return [
      think(700), blk('Operacions · infra-audit · només lectura'),
      par([
        { tag: 'MCP GET', text: 'registres DNS', result: 'CNAME old.clinicbook.app apunta a un host esborrat', status: 'fail', ms: 1100 },
        { tag: 'MCP GET', text: 'autenticació del correu', result: 'SPF i DKIM bé, DMARC p=none', status: 'warn', ms: 1300 },
        { tag: 'MCP GET', text: 'buckets', result: 'cap de públic', status: 'ok', ms: 900 },
      ]),
      line('limits', 'el job de recordatoris arrenca totes les clíniques al mateix minut, sense paginar · 3 cues comparteixen un límit de concurrència i el superen entre totes', 'warn', C.warn),
      line('alert', 'errors del webhook de pagaments → alerta per xat, correu de reserva, sense dades personals', 'dot', C.info),
      line('heartbeat', 'els dos crons donen senyal; un cicle en silenci llança una alerta', 'dot', C.info),
      line('automation', 'una spec → GitHub Actions, Orca o Claude Code; la clau de l’agent mai comparteix job amb un token d’escriptura', 'dot', C.info),
      say('L’auditoria no arregla res: un registre penjat és un segrest de subdomini esperant a passar, així que t’arriba com a passos al tauler. Els límits van al registre, cadascun amb el seu sostre de despesa i què passa en arribar-hi.'),
    ]
    if (m === 'ops') return [
      think(700), blk('Operacions · planificades abans del llançament'),
      line('health', 'health check i uptime des del primer deploy', 'dot', C.info),
      line('limits', 'cada límit del pla gratuït al registre: avís al 70%, escala sol només sota un sostre de despesa, es degrada al sostre', 'dot', C.info),
      line('alert', 'errors de pagament → alerta per xat, correu de reserva, sense dades personals', 'dot', C.info),
      line('infra-audit', 'mensual, només lectura amb el MCP del proveïdor', 'dot', C.info),
      line('checklist', 'preparació per a producció · 20 punts, del rollback als límits de despesa', 'dot', C.info),
      say('Encara no s’executa res contra producció: la checklist tanca el pas al primer llançament.'),
    ]
    if (m === 'brand') return [
      think(700), blk('Pas de marca'),
      tool('Check', 'noms candidats · dominis i marques', 'en queden 3 de 12', 'ok', 900),
      tool('Contrast', 'blanc sobre #FF7058', '2,72:1, no passa WCAG 2.2 AA', 'fail', 700),
      tool('Contrast', '#0E1130 sobre #FF7058', '6,8:1, passa', 'ok', 700),
      say('Tres direccions de color amb captures a 1440 i 390. No s’implementa res fins que en triïs una.'),
    ]
    if (m === 'stack') return [
      think(700), blk('Mòdul de stack · proves de càrrega'),
      line('profile', 'stack per entorn: dev, stage, prod', 'dot', C.info),
      tool('k6', 'staging.clinicbook.app', 'a stageHosts, permès', 'ok', 700),
      tool('k6', 'api.clinicbook.app', 'a prodHosts, rebutjat', 'fail', 700),
      say('La guarda de producció falla tancada: amb hosts d’exemple ho rebutja tot.'),
    ]
    return [
      think(700), blk('Legal · primer l’evidència'),
      line('processors', 'proveïdor de pagaments, proveïdor de correu, allotjament', 'dot', C.info),
      line('discrepància', 'la pàgina de privacitat diu «sense tercers» i el codi envia correus amb un proveïdor', 'warn', C.warn),
      line('pregunta', 'quant de temps guardes les notes de pacients? → fundador', 'dot', C.ink),
      say('Preguntes per a tu i esborranys marcats com a esborranys per a un advocat. Cap text legal final.'),
    ]
  }

  function afterModules(sel) {
    var b = []
    sel.forEach(function (m) { b = b.concat(moduleBeats(m)) })
    b = b.concat([phase(5), think(900), blk('Fase 4 · Proposta · cada decisió es converteix en una comprovació')])
    if (MODE === 'existing') b.push(line('audit', 'CLAUDE.md: cada bloc com a mantenir / reescriure / treure amb un motiu, ensenyat abans d’escriure', 'ok', C.ok))
    return b.concat([
      line('rules', 'pla abans del codi, primer la documentació, registre de decisions → CLAUDE.md', 'ok', C.ok),
      line('hooks', 'bloquejar force-push a main, preguntar abans de qualsevol escriptura cap enfora', 'ok', C.ok),
      line('lint', MODE === 'existing' ? 'res de client de BD al codi d’UI (11 infraccions llistades)' : 'fronteres entre capes, cap SDK directe fora de la seva passarel·la', 'ok', C.ok),
      line('tests', MODE === 'existing' ? 'el test de deduplicació del webhook falla avui, a propòsit' : 'el registre de rutes coincideix amb el sistema de fitxers', 'ok', C.ok),
      line('CI', 'config sincronitzada, tests a cada PR, porta de plan-folder, pins per SHA complet', 'ok', C.ok),
      line('perms', 'denegar secrets, preguntar abans de publicar o desplegar', 'ok', C.ok),
      say('Cada fila cita la seva evidència, i el que no tenia senyal ha anat a una llista de Més endavant. Encara no s’ha escrit res.'),
      { t: 'ask', q: {
        id: 'go', title: 'Pregunta 7 · Sortida', multi: false,
        options: [
          { id: 'go', label: 'Go', sub: 'Generar-ho com a pull requests, una per família.', rec: true },
          { id: 'proposal', label: 'Només la proposta', sub: 'Parar aquí perquè la pugui llegir i canviar.' },
        ] } },
    ])
  }

  var MOD_PR = { ops: 'operacions: monitoratge, alertes, límits de proveïdors, infra-audit', brand: 'pas de marca: DESIGN.md, comprovació de contrast', stack: 'perfil de stack, k6 amb guarda de producció', legal: 'legal: inventari d’evidència, preguntes al fundador' }

  function afterGo(id, mods) {
    if (id === 'proposal') return [
      think(700), blk('Aturat després de la fase 4'),
      line('file', '.context/repo-bootstrap/proposal.md', 'ok', C.ok),
      line('file', '.context/repo-bootstrap/choices.md', 'ok', C.ok),
      say('Canvia el que vulguis i digues go quan et sembli bé.'),
      { t: 'done' },
    ]
    var prs = (MODE === 'existing' ? ['auditoria de CLAUDE.md + regles arrel', 'hooks + permisos'] : ['regles arrel + hooks + permisos'])
      .concat(['lint + tests d’arquitectura', 'CI']).concat(mods.map(function (m) { return MOD_PR[m] }))
    var items = prs.map(function (p, i) { return { tag: 'PR #' + (i + 1), text: p, result: 'oberta', status: 'ok', ms: 900 + i * 350 } })
    return [phase(6), think(700), blk('Fase 5 · Generar · subagents en paral·lel'), par(items),
      blk('Fase 6 · Verificar'),
      tool('hook', 'git push --force origin main', 'bloquejat', 'ok', 700),
      tool('CI', 'cada PR', 'en verd', 'ok', 900),
      line('reflect', 'instal·lat: la teva propera correcció es converteix en una regla i una comprovació', 'ok', C.ok),
      say('Fet. Cada barana s’ha executat un cop contra alguna cosa real abans de donar-ho per acabat.'),
      { t: 'done' },
    ]
  }

  return {
    phases: ['Scan', 'Propòsit', 'Entendre', 'Disseny', 'Mòduls', 'Proposta', 'Go'],
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
