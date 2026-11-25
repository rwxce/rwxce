/* /repo-bootstrap demo script, English. Played by assets/demo.js. Example data only. */
window.ArkDemoScript = function (h) {
  'use strict'
  var C = h.C, blk = h.blk, say = h.say, tool = h.tool, line = h.line, quote = h.quote, par = h.par, wait = h.wait, think = h.think, phase = h.phase
  var MODE = 'new'
  var REPO = 'new'

  var ui = {
    recommended: 'Recommended', recShort: 'rec.', continue: 'Continue', replay: 'Replay the demo',
    verdict: 'Verdict', confidence: 'Confidence', verdictNote: 'A confidence in the evidence, not a probability of success.',
    working: 'The agent is working', hintWorking: 'The agent is working…', hintAsk: 'Pick an answer above',
    hintSetup: 'Pick a repo to start the demo', hintDone: 'Demo finished. Replay it with the other repo or other answers.',
  }

  function intro() {
    return [
      wait(300),
      { t: 'ask', q: {
        id: 'repo', title: 'Demo setup · pick a repo to run it on', multi: false, setup: true,
        options: [
          { id: 'new', label: 'A new repo', sub: 'Empty: no code, no config. You bring the idea.' },
          { id: 'existing', label: 'An existing repo', sub: 'A booking SaaS in production, with code and an old CLAUDE.md.' },
        ] } },
    ]
  }

  function start(repo) {
    REPO = repo
    if (repo === 'new') {
      return [
        wait(200), { t: 'compose', text: '/repo-bootstrap I want to build online booking for small physio clinics' }, { t: 'send' },
        phase(0), think(800),
        blk('Phase 0 · Light scan · read-only'),
        tool('Glob', '**/*', 'only .gitignore and an empty README', 'skip'),
        tool('Bash', 'git log --oneline | wc -l', '1 commit', 'skip'),
        tool('Glob', 'CLAUDE.md · AGENTS.md · .rulesync/', 'none', 'skip'),
        tool('Glob', '.github/workflows/', 'none', 'skip'),
        say('The repo is empty, so there is nothing to analyse: this is a new project. Everything I know comes from your message. Confirm the mode; it changes how I learn about the product.'),
        askMode(repo),
      ]
    }
    return [
      wait(200), { t: 'compose', text: '/repo-bootstrap audit' }, { t: 'send' },
      phase(0), think(800),
      blk('Phase 0 · Light scan · read-only'),
      tool('Read', 'package.json', 'web framework, payments SDK, ORM, test runner'),
      tool('Bash', 'git log --oneline | wc -l', '1,940 commits · 214 source files'),
      tool('Read', 'CLAUDE.md', '18 KB, last edited months ago', 'warn'),
      tool('Glob', '.github/workflows/', 'ci.yml, deploy.yml'),
      tool('Grep', 'payments|webhook|cron', 'webhook route, 2 crons, pricing page'),
      line('goal', 'audit and improve (from the “audit” argument)', 'ok', C.ok),
      say('Real code, real history and an agent config that has grown on its own: this looks like an existing project. Confirm the mode; it changes how I learn about the repo.'),
      askMode(repo),
    ]
  }

  function askMode(repo) {
    return { t: 'ask', q: {
      id: 'mode', title: 'Question 2 · Mode · pre-selected from the scan', multi: false,
      options: [
        { id: 'new', label: 'New / clean project', sub: 'Little or no code. The setup comes from an interview and templates.', rec: repo === 'new' },
        { id: 'existing', label: 'Existing project', sub: 'Code to analyse. Every proposal cites file:line.', rec: repo === 'existing' },
      ] } }
  }

  function afterMode(mode) {
    if (REPO === 'new' && mode === 'existing') {
      MODE = 'new'
      return [think(600), blk('Mode'), say('There is no code here for the discovery lenses to read, so they would return nothing. I run it as a new project and keep your choice in choices.md.')].concat(askPurpose())
    }
    MODE = mode
    if (REPO === 'existing' && mode === 'new') {
      return [think(600), blk('Mode · start over'), say('The existing code stays as it is. The setup comes from an interview and templates, and the old CLAUDE.md is still audited block by block, never dropped by title.')].concat(askPurpose())
    }
    return askPurpose()
  }

  function askPurpose() {
    var signal = REPO === 'new' ? 'From your message: clinics are the buyers.' : 'A payments SDK and a pricing page found.'
    return [
      phase(1), think(600),
      blk('Question 0 · Purpose'),
      say('What is it for? This decides which phases run.'),
      { t: 'ask', q: {
        id: 'purpose', title: 'Question 0 · Purpose', multi: false,
        options: [
          { id: 'b2b', label: 'Make money · B2B SaaS', sub: 'Clinics pay per account. ' + signal, rec: true },
          { id: 'b2c', label: 'Make money · B2C', sub: 'Patients book and pay directly.' },
          { id: 'app', label: 'Make money · App', sub: 'Mobile app, sold or by subscription.' },
          { id: 'own', label: 'Own tool', sub: 'For my own clinic. Skips research, validation, pricing and growth.' },
        ] } },
    ]
  }

  function afterPurpose(id) {
    if (MODE === 'existing') return discovery(id)
    if (id === 'own') {
      return [
        phase(2), think(700),
        blk('Recorded in .context/repo-bootstrap/choices.md'),
        line('skipped', 'idea research (purpose: own tool)', 'skip', C.dim),
        line('skipped', 'market validation · pricing · growth', 'skip', C.dim),
        say('Skipped, not deleted. If the purpose changes later I re-run the menu, and nothing already generated is removed.'),
      ].concat(askSensitive())
    }
    var variant = id === 'b2b' ? 'B2B review sites and buyer threads' : (id === 'b2c' ? 'consumer forums and app reviews' : 'app store reviews')
    return [
      phase(2), think(900),
      blk('Phase 1 · Idea research · before any code'),
      say('Before any code: does this idea deserve the next commitment? Six steps with real data, every fact with its source and the date it was read.'),
      tool('Search', 'product directories, app stores, code hosts', '7 products do this job', 'ok', 900),
      tool('Read', '1–3 star reviews · ' + variant, '142 complaints read', 'ok', 1000),
      wait(250),
      blk('Competition in four kinds'),
      line('DIRECT', 'clinic management suites with booking built in', 'dot', C.info),
      line('SUBSTITUTE', 'front-desk staff answering the phone', 'dot', C.info),
      line('HOMEMADE', 'a shared calendar plus chat reminders', 'dot', C.info),
      line('CONVERGENCE', 'calendar tools one feature away from this job', 'dot', C.info),
      wait(250),
      blk('Pain clusters · verbatim quotes, no usernames'),
      line('cluster 1', 'no-shows that nobody chases', 'dot', C.ink),
      quote('Half my Monday slots are no-shows and the app does nothing about it.', 'review site · 2★ · read 2026-11-25'),
      quote('Reminders exist but patients cannot reschedule from them.', 'buyer thread · read 2026-11-25'),
      line('cluster 2', 'pricing per practitioner hurts small clinics', 'dot', C.ink),
      quote('We are two physios and pay like a hospital.', 'review site · 1★ · read 2026-11-25'),
      line('gap', 'reschedule from the reminder itself; nobody does it', 'dot', C.warn),
      wait(300),
      { t: 'verdict', label: 'Test before building', conf: 'medium', pct: 58 },
      say('The cheapest experiment: a waitlist page for clinics with one to three practitioners, with the pass, fail and inconclusive thresholds written down first. The result goes to the calibration log, and the quotes feed the synthetic buyer panel: hypotheses, never decisions.'),
      { t: 'ask', q: {
        id: 'verdict', title: 'What now?', multi: false,
        options: [
          { id: 'go', label: 'Keep going with the setup', sub: 'Run the experiment in parallel. Next: system design.', rec: true },
          { id: 'reshape', label: 'Reshape around the gap', sub: 'Lead with rescheduling from the reminder.' },
          { id: 'park', label: 'Park the idea', sub: 'Keep the evidence, write nothing else.' },
        ] } },
    ]
  }

  function discovery(purpose) {
    var b = [phase(2), think(800), blk('Phase 1 · Discovery lenses · parallel, read-only subagents')]
    b.push(say('Seven lenses run at the same time. Each one returns only a short table, and every row cites file:line.'))
    b.push(par([
      { tag: 'stack', text: 'stack and infrastructure', result: 'web framework, Postgres via an ORM, serverless hosting · package.json:14', status: 'ok', ms: 1100 },
      { tag: 'flows', text: 'sensitive domains', result: 'payments, staff auth, patient notes · app/api/payments/route.ts:22', status: 'ok', ms: 1500 },
      { tag: 'workflow', text: 'dev workflow', result: 'CI runs lint only, no tests on PRs · ci.yml:9', status: 'warn', ms: 1300 },
      { tag: 'services', text: 'external services', result: 'payments (official MCP), email, error monitoring', status: 'ok', ms: 1700 },
      { tag: 'code', text: 'code and architecture', result: 'UI imports the DB client directly in 11 files', status: 'warn', ms: 1900 },
      { tag: 'config', text: 'existing AI config audit', result: '3 stale facts, 2 conflicting rules · CLAUDE.md:48', status: 'fail', ms: 2100 },
      { tag: 'ops', text: 'operations', result: '2 crons with no alert on failure', status: 'warn', ms: 1600 },
    ]))
    b.push(line('in-house', 'sessions built by hand · lib/session.ts (420 lines) → a finding for integrate-before-build, never a migration on its own', 'warn', C.warn))
    if (purpose === 'own') b.push(line('skipped', 'idea research · pricing · growth (purpose: own tool)', 'skip', C.dim))
    else b.push(line('research', 'idea research is only proposed here for a big change, such as a new audience', 'skip', C.dim))
    b.push(say('The code has a dominant style, with some outliers. How should I treat it?'))
    b.push({ t: 'ask', q: {
      id: 'style', title: 'Question 5 · Code style', multi: false,
      options: [
        { id: 'follow', label: 'Follow the existing style', sub: 'Encode it in formatter, lint and Build rules. No source changes.', rec: true },
        { id: 'refactor', label: 'Behavior-preserving refactor', sub: 'A separate plan: characterization tests first, then small PRs.' },
        { id: 'leave', label: 'Leave it alone', sub: 'Touch nothing about style.' },
      ] } })
    return b
  }

  function afterStyle(id) {
    var note = id === 'follow' ? 'Measured: single quotes 94%, no semicolons 97%. Outliers listed with file:line; no file is touched.'
      : id === 'refactor' ? 'A separate refactor plan, never mixed with the bootstrap PRs: characterization tests, one mechanical formatting PR, then per-module refactors that prove identical behavior.'
      : 'Style is left as it is and recorded in choices.md.'
    return [
      think(600), blk('Phase 2 · Code style'), say(note),
      phase(3), think(900),
      blk('Phase 1b · System design · the real one, as it is'),
      say('For an existing repo I document the design that is really there, with evidence, and write ADRs only for the decisions that carry weight.'),
      line('ADR-R1', 'the payments provider is the billing source of truth · route.ts:22 · enforced by test: verify, dedupe, re-read', 'ok', C.ok),
      line('ADR-R2', 'access checked in middleware · middleware.ts:5 · enforced by lint: no route outside the registry', 'ok', C.ok),
      tool('Risk', 'webhook handler without dedupe', 'route.ts:41, a retried event charges twice', 'fail', 900),
      say('A migration only happens with a verified risk, compared alternatives, a reversible path and your go. Now, how deep should the rest go?'),
    ].concat(askDepth(true))
  }

  function afterVerdict(id) {
    if (id === 'park') {
      return [
        think(700), blk('Parked'),
        line('saved', '.context/research/idea-2026-11-25.md · sources and dates', 'ok', C.ok),
        say('Parked with all the evidence. Nothing else was written. You can come back to it when the experiment has a result.'),
        { t: 'done' },
      ]
    }
    var pre = id === 'reshape'
      ? [think(600), blk('Reshaped'), say('The positioning now leads with rescheduling from the reminder. I update the brief and keep the quotes that back it.')]
      : []
    return pre.concat(askSensitive())
  }

  function askSensitive() {
    return [
      think(700),
      blk('Phase 1 · Interview · one question at a time'),
      say('Which sensitive domains will it touch? They decide how deep the system design goes and which concepts apply.'),
      { t: 'ask', q: {
        id: 'sensitive', title: 'Sensitive domains · pick any', multi: true,
        options: [
          { id: 'money', label: 'Payments', sub: 'Subscriptions, card payments, refunds.', sel: true },
          { id: 'auth', label: 'Accounts and access', sub: 'Clinic staff, roles, patient logins.', sel: true },
          { id: 'data', label: 'Health and personal data', sub: 'Patient names, notes, appointments.', sel: true },
          { id: 'jobs', label: 'Crons and webhooks', sub: 'Reminders, provider callbacks.' },
        ] } },
    ]
  }

  function askDepth(rec) {
    return [{ t: 'ask', q: {
      id: 'depth', title: 'Question 6 · Depth', multi: false,
      options: [
        { id: 'full', label: 'Full', sub: 'Adds a big-feature benchmark in fresh contexts. About 200–300k tokens more.', rec: rec },
        { id: 'quick', label: 'Quick', sub: 'Proposal from discovery and the catalog. About 60–120k tokens.', rec: !rec },
      ] } }]
  }

  function afterSensitive(sel) {
    var size = sel.length >= 3 ? 'deep' : (sel.length >= 1 ? 'standard' : 'light')
    var b = [
      phase(3), think(900),
      blk('Phase 1b · System design · sized ' + size),
      say('Requirements, trust boundaries and risks first. Then two to four alternatives for every open decision, compared on criteria anyone can check.'),
      tool('Compare', 'auth: in-house vs managed provider', 'managed (license, CVEs of the exact version, modelled cost)', 'ok', 900),
    ]
    if (sel.indexOf('money') >= 0) b.push(line('ADR-001', 'payments via provider webhooks · enforced by test: verify, dedupe, re-read', 'ok', C.ok))
    if (sel.indexOf('auth') >= 0) b.push(line('ADR-002', 'access checked at the data boundary · enforced by lint', 'ok', C.ok))
    if (sel.indexOf('data') >= 0) b.push(line('ADR-003', 'patient data encrypted, restore tested monthly · enforced by CI', 'ok', C.ok))
    if (sel.indexOf('jobs') >= 0) b.push(line('ADR-004', 'reminders as durable jobs with retries · enforced by test', 'ok', C.ok))
    b.push(line('dropped', 'transactional outbox · its “when not” matches: one database, no queue', 'skip', C.dim))
    b.push(say('Every ADR names the check that enforces it, and on a new project the design waits for your go too. Now, how deep should the rest go?'))
    return b.concat(askDepth(sel.length > 0))
  }

  function afterDepth(id) {
    var b = []
    if (id === 'full') {
      b = b.concat([
        think(800),
        blk('Phase 3 · Benchmark · fresh contexts'),
        say('An invented cross-cutting feature: family accounts with shared billing. Three planners, read-only, each must list what would break.'),
        par([
          { tag: 'Planner A', text: 'no protocol', result: '4 of 18 side effects', status: 'warn', ms: 1200 },
          { tag: 'Planner B', text: 'no protocol', result: '6 of 18 side effects', status: 'warn', ms: 1500 },
          { tag: 'Planner C', text: 'with the planning protocol', result: '17 of 18 side effects', status: 'ok', ms: 1900 },
        ]),
        say('The merged list of 18 seeds the side-effect registry. A written protocol beats a bigger model.'),
      ])
    }
    return b.concat([
      phase(4), think(700),
      blk('Question 9 · Product modules'),
      say((REPO === 'new' ? 'The interview' : 'The scan') + ' found signals for these modules. Pick the ones you want; each one comes with its own checks.'),
      { t: 'ask', q: {
        id: 'modules', title: 'Product modules · pick any', multi: true,
        options: [
          { id: 'ops', label: 'Operations', sub: 'Infra audit, monitoring, critical alerts, provider limits, portable automations.', sel: true, rec: true },
          { id: 'brand', label: 'Brand', sub: 'Naming, logo, 60-30-10 palette, contrast check.' },
          { id: 'stack', label: 'Stack + load testing', sub: 'Stack profile and k6, never against production.' },
          { id: 'legal', label: 'Legal', sub: 'Evidence and questions for the founder, never final legal text.' },
        ] } },
    ])
  }

  function moduleBeats(m) {
    if (m === 'ops' && MODE === 'existing') return [
      think(700), blk('Operations · infra-audit · read-only'),
      par([
        { tag: 'MCP GET', text: 'DNS records', result: 'CNAME old.clinicbook.app points at a deleted host', status: 'fail', ms: 1100 },
        { tag: 'MCP GET', text: 'email auth', result: 'SPF and DKIM ok, DMARC p=none', status: 'warn', ms: 1300 },
        { tag: 'MCP GET', text: 'buckets', result: 'none public', status: 'ok', ms: 900 },
      ]),
      line('limits', 'the reminder job starts every clinic at the same minute, unpaginated · 3 queues share one concurrency limit and add up past it', 'warn', C.warn),
      line('alert', 'payment webhook failures → chat alert, email fallback, no personal data', 'dot', C.info),
      line('heartbeat', 'both crons report in; silence for one cycle raises an alert', 'dot', C.info),
      line('automation', 'one spec → GitHub Actions, Orca or Claude Code; the agent key never shares a job with a write token', 'dot', C.info),
      say('The audit fixes nothing: a dangling record is a subdomain takeover waiting to happen, so it goes to you as dashboard steps. The limits go to the registry, each with a spend cap and what happens at it.'),
    ]
    if (m === 'ops') return [
      think(700), blk('Operations · planned before launch'),
      line('health', 'health check and uptime from the first deploy', 'dot', C.info),
      line('limits', 'every free-tier limit in the registry: warn at 70%, scale on its own only under a spend cap, degrade at the cap', 'dot', C.info),
      line('alert', 'payment failures → chat alert, email fallback, no personal data', 'dot', C.info),
      line('infra-audit', 'monthly, read-only through the provider MCP', 'dot', C.info),
      line('checklist', 'production readiness · 20 points, from rollback to spend limits', 'dot', C.info),
      say('Nothing runs against production yet: the checklist gates the first launch.'),
    ]
    if (m === 'brand') return [
      think(700), blk('Brand step'),
      tool('Check', 'name candidates · domains and trademarks', '3 of 12 left', 'ok', 900),
      tool('Contrast', 'white on #FF7058', '2.72:1, fails WCAG 2.2 AA', 'fail', 700),
      tool('Contrast', '#0E1130 on #FF7058', '6.8:1, passes', 'ok', 700),
      say('Three colour directions with screenshots at 1440 and 390. Nothing is implemented until you pick one.'),
    ]
    if (m === 'stack') return [
      think(700), blk('Stack module · load testing'),
      line('profile', 'stack per environment: dev, stage, prod', 'dot', C.info),
      tool('k6', 'staging.clinicbook.app', 'in stageHosts, allowed', 'ok', 700),
      tool('k6', 'api.clinicbook.app', 'in prodHosts, refused', 'fail', 700),
      say('The production guard fails closed: with placeholder hosts it refuses everything.'),
    ]
    return [
      think(700), blk('Legal · evidence first'),
      line('processors', 'payments provider, email provider, hosting', 'dot', C.info),
      line('mismatch', 'privacy page says “no third parties”, code sends emails via a provider', 'warn', C.warn),
      line('question', 'how long do you keep patient notes? → founder', 'dot', C.ink),
      say('Questions for you and drafts marked as drafts for a lawyer. No final legal text.'),
    ]
  }

  function afterModules(sel) {
    var b = []
    sel.forEach(function (m) { b = b.concat(moduleBeats(m)) })
    b = b.concat([phase(5), think(900), blk('Phase 4 · Proposal · every decision becomes a check')])
    if (MODE === 'existing') b.push(line('audit', 'CLAUDE.md: every block as keep / rewrite / remove with a reason, shown before writing', 'ok', C.ok))
    return b.concat([
      line('rules', 'plan before code, docs first, decision log → CLAUDE.md', 'ok', C.ok),
      line('hooks', 'block force-push to main, ask before any outward write', 'ok', C.ok),
      line('lint', MODE === 'existing' ? 'no DB client in UI code (11 violations listed)' : 'layer boundaries, no raw SDK outside its gateway', 'ok', C.ok),
      line('tests', MODE === 'existing' ? 'webhook dedupe test fails today, by design' : 'route registry matches the filesystem', 'ok', C.ok),
      line('CI', 'config sync, tests on every PR, plan-folder gate, pins by full SHA', 'ok', C.ok),
      line('perms', 'deny secrets, ask before publishing or deploying', 'ok', C.ok),
      say('Every row cites its evidence, and anything without a signal went to a Later list. Nothing has been written yet.'),
      { t: 'ask', q: {
        id: 'go', title: 'Question 7 · Output', multi: false,
        options: [
          { id: 'go', label: 'Go', sub: 'Generate it as pull requests, one per family.', rec: true },
          { id: 'proposal', label: 'Proposal only', sub: 'Stop here so I can read and change it.' },
        ] } },
    ])
  }

  var MOD_PR = { ops: 'operations: monitoring, alerts, provider limits, infra-audit', brand: 'brand step: DESIGN.md, contrast check', stack: 'stack profile, k6 with prod guard', legal: 'legal: evidence inventory, founder questions' }

  function afterGo(id, mods) {
    if (id === 'proposal') return [
      think(700), blk('Stopped after Phase 4'),
      line('file', '.context/repo-bootstrap/proposal.md', 'ok', C.ok),
      line('file', '.context/repo-bootstrap/choices.md', 'ok', C.ok),
      say('Change anything you like and say go when it looks right.'),
      { t: 'done' },
    ]
    var prs = (MODE === 'existing' ? ['CLAUDE.md audit + root rules', 'hooks + permissions'] : ['root rules + hooks + permissions'])
      .concat(['lint + architecture tests', 'CI']).concat(mods.map(function (m) { return MOD_PR[m] }))
    var items = prs.map(function (p, i) { return { tag: 'PR #' + (i + 1), text: p, result: 'opened', status: 'ok', ms: 900 + i * 350 } })
    return [phase(6), think(700), blk('Phase 5 · Generate · parallel subagents'), par(items),
      blk('Phase 6 · Verify'),
      tool('hook', 'git push --force origin main', 'blocked', 'ok', 700),
      tool('CI', 'every PR', 'green', 'ok', 900),
      line('reflect', 'installed: your next correction becomes a rule and a check', 'ok', C.ok),
      say('Done. Every guardrail ran once against something real before I called it finished.'),
      { t: 'done' },
    ]
  }

  return {
    phases: ['Scan', 'Purpose', 'Understand', 'Design', 'Modules', 'Proposal', 'Go'],
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
