/* Native Node 22 + Chrome CDP smoke. Only the disposable test stack is allowed. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const API = (process.env.SMOKE_API_URL || 'http://localhost:18000/api/v1').replace(/\/$/, '');
const WEB = (process.env.SMOKE_WEB_URL || 'http://localhost:13000').replace(/\/$/, '');
const PASSWORD = 'Password-CI!2026', suffix = Date.now().toString(36);
const issues = [], active = new Set(), pending = new Map(), requestMethods = new Map(), expectedResponses = [], riskIds = [], userIds = [];
let chrome, socket, profile, report, sequence = 0, adminToken, checks = 0, passwordValidationRegressions = 0, lastNetwork = 0, launchFailed = false;
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const chromeRunning = () => chrome && chrome.exitCode === null && chrome.signalCode === null;

async function until(check, label, timeout = 25000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (launchFailed || (chrome && !chromeRunning())) throw Error('Chrome stopped unexpectedly.');
    try { if (await check()) return; } catch { /* Navigation can replace the execution context. */ }
    await pause(100);
  }
  throw Error(`Timed out: ${label}`);
}
async function api(route, {method = 'GET', body, token = adminToken} = {}) {
  const response = await fetch(API + route, {
    method, headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), ...(body ? {'Content-Type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, `Fixture API ${method} ${route} failed`);
  const result = await response.json();
  assert.equal(result.success, true, 'Fixture API returned an invalid envelope');
  return result.data;
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(fn, ...args) {
  const result = await send('Runtime.evaluate', {
    expression: `(${fn.toString()})(...${JSON.stringify(args)})`, returnByValue: true, awaitPromise: true,
  });
  if (result.exceptionDetails) throw Error('Browser DOM evaluation failed.');
  return result.result.value;
}
function localURL(raw) {
  try { const url = new URL(raw); return [new URL(API).origin, new URL(WEB).origin].includes(url.origin) ? url : null; }
  catch { return null; }
}
async function openBrowser() {
  profile = await fs.mkdtemp(path.join(os.tmpdir(), 'riskops-browser-'));
  chrome = spawn(process.env.CHROME_BIN || 'google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], {windowsHide: true, stdio: 'ignore'});
  chrome.on('error', () => { launchFailed = true; });
  let port;
  await until(async () => { port = Number((await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); return port > 0; }, 'Chrome CDP startup');
  let target;
  await until(async () => {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = targets.find(item => item.type === 'page'); return Boolean(target);
  }, 'Chrome page target');
  assert.ok(target, 'Chrome did not create a page target');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Chrome CDP connection timed out.')), 15000);
    socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, {once: true});
    socket.addEventListener('error', () => { clearTimeout(timeout); reject(Error('Chrome CDP connection failed.')); }, {once: true});
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const command = pending.get(message.id);
      if (!command) return;
      clearTimeout(command.timer); pending.delete(message.id);
      if (message.error) command.reject(Error('Chrome CDP command failed.')); else command.resolve(message.result);
      return;
    }
    const data = message.params || {};
    if (message.method === 'Runtime.exceptionThrown' || (message.method === 'Runtime.consoleAPICalled' && data.type === 'error')) issues.push('Browser runtime error');
    if (message.method === 'Network.requestWillBeSent' && localURL(data.request.url)) {
      active.add(data.requestId); requestMethods.set(data.requestId, data.request.method); lastNetwork = Date.now();
    }
    if (message.method === 'Network.responseReceived' && data.response.status >= 400) {
      const url = localURL(data.response.url);
      if (url) {
        const expected = expectedResponses.find(item => !item.consumed && item.method === requestMethods.get(data.requestId)
          && item.origin === url.origin && item.pathname === url.pathname && item.status === data.response.status);
        if (expected) expected.consumed = true;
        else issues.push(`HTTP ${data.response.status}: ${url.pathname}`);
      }
    }
    if (message.method === 'Network.loadingFailed' && active.has(data.requestId) && !data.canceled && data.errorText !== 'net::ERR_ABORTED') issues.push('Browser network request failed');
    if (['Network.loadingFinished', 'Network.loadingFailed'].includes(message.method)) { active.delete(data.requestId); requestMethods.delete(data.requestId); lastNetwork = Date.now(); }
  });
  socket.addEventListener('close', () => {
    for (const command of pending.values()) { clearTimeout(command.timer); command.reject(Error('Chrome CDP closed.')); }
    pending.clear();
  });
  await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Network.enable')]);
}
async function ready(selector) {
  await until(async () => !active.size && Date.now() - lastNetwork > 300 && await evaluate(css =>
    document.readyState === 'complete' && Boolean(document.querySelector(css)) && !document.querySelector('.loading-state'), selector), `page ${selector}`);
  assert.equal(await evaluate(() => Boolean(document.querySelector('.error-state'))), false, 'Page displays an error state');
  assert.equal(issues.length, 0, issues[0] || 'Unexpected browser errors');
  checks++;
}
async function navigate(method, params, selector) {
  await evaluate(() => { window.__riskopsSmokeNavigation = true; });
  await send(method, params);
  await until(() => evaluate(() => !window.__riskopsSmokeNavigation), 'new browser document');
  await ready(selector);
}
async function go(route, selector) { await navigate('Page.navigate', {url: WEB + route}, selector); }
async function fill(selector, value) {
  await evaluate((css, next) => {
    const input = document.querySelector(css);
    if (!input) throw Error('Input missing');
    const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, String(next));
    input.dispatchEvent(new Event('input', {bubbles: true})); input.dispatchEvent(new Event('change', {bubbles: true}));
  }, selector, value);
}
async function click(selector) { await evaluate(css => { const node = document.querySelector(css); if (!node) throw Error('Control missing'); node.click(); }, selector); }
async function login(email, password = PASSWORD) {
  if (await evaluate(() => Boolean(localStorage.getItem('riskops_token')))) {
    await go('/dashboard', '.dashboard-page'); await click('.navbar-logout');
    await until(() => evaluate(() => location.pathname === '/login' && !localStorage.getItem('riskops_token')), 'UI logout');
  }
  await go('/login', '.login-form');
  await fill('#login-email', email); await fill('#login-password', password); await click('.login-form button[type="submit"]');
  await ready('.dashboard-page');
  assert.equal(await evaluate(() => location.pathname), '/dashboard', 'UI login did not reach dashboard');
}
async function viewport(width) { await send('Emulation.setDeviceMetricsOverride', {width, height: 1000, deviceScaleFactor: 1, mobile: width < 500}); }

async function run() {
  assert.equal(process.env.SMOKE_ALLOW_WRITES, 'true', 'Browser smoke requires SMOKE_ALLOW_WRITES=true for the disposable stack.');
  for (const [raw, port] of [[API, '18000'], [WEB, '13000']]) {
    const url = new URL(raw);
    assert.ok(url.protocol === 'http:' && !url.username && !url.password && ['localhost', '127.0.0.1'].includes(url.hostname) && url.port === port, 'Browser smoke targets must use isolated loopback ports without URL credentials.');
  }
  adminToken = (await api('/auth/login', {method: 'POST', token: null, body: {email: 'ci-admin@example.com', password: 'RiskOps-CI-admin!2026'}})).access_token;
  const category = (await api('/risk-categories'))[0];
  const title = `Riesgo navegador ${suffix}`;
  const risk = await api('/risks', {method: 'POST', body: {title, category_id: category.id, probability: 5, impact: 5}}); riskIds.push(risk.id);
  const control = await api('/risks', {method: 'POST', body: {title: `Control navegador ${suffix}`, category_id: category.id, probability: 2, impact: 2}}); riskIds.push(control.id);
  const actors = {};
  for (const role of ['ANALYST', 'RISK_MANAGER', 'VIEWER']) {
    actors[role] = await api('/users', {method: 'POST', body: {full_name: `Navegador ${role}`, email: `browser-${role.toLowerCase()}-${suffix}@example.com`, password: PASSWORD, roles: [role]}});
    userIds.push(actors[role].id);
  }
  await openBrowser(); await viewport(1440); await go('/login', '.login-form');
  await login('ci-admin@example.com', 'RiskOps-CI-admin!2026');
  await navigate('Page.reload', {ignoreCache: true}, '.dashboard-page');
  assert.equal(await evaluate(() => Boolean(localStorage.getItem('riskops_token'))), true, 'Login did not persist after reload');
  const routes = [
    ['/dashboard', '.dashboard-page'], ['/risks', '.risks-page'], ['/risks/new', '.risk-new-page'],
    [`/risks/${risk.id}`, '.risk-detail-page'], [`/risks/${risk.id}/edit`, '.risk-edit-page'], ['/risk-matrix', '.risk-matrix-page'],
    ['/mitigations', '.mitigations-page'], ['/reports', '.reports-page'], ['/analytics', '.analytics-page'],
    ['/notifications', '.notifications-page'], ['/users', '.users-page'], ['/profile', '.profile-page'], ['/login', '.login-form'], ['/browser-missing-page', '.not-found-page'],
  ];
  for (const width of [1440, 390]) {
    await viewport(width);
    for (const [route, selector] of routes) {
      await go(route, selector);
      assert.equal(await evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true, `Horizontal overflow: ${width}px ${route}`);
    }
  }
  await viewport(1440); await go('/profile', '.profile-page');
  assert.equal(await evaluate(() => document.querySelectorAll('.profile-page form').length), 2, 'Profile forms are missing');
  const tokenBeforeRejectedPassword = await evaluate(() => localStorage.getItem('riskops_token'));
  assert.ok(tokenBeforeRejectedPassword, 'Password validation requires an authenticated session');
  const rejectedPasswordResponse = {method: 'POST', origin: new URL(WEB).origin, pathname: '/api/v1/auth/change-password', status: 422, consumed: false};
  expectedResponses.push(rejectedPasswordResponse);
  await fill('#profile-current-password', 'Incorrect-current!2026');
  await fill('#profile-new-password', 'Password-rejected!2026');
  await evaluate(() => document.querySelectorAll('.profile-page form')[1].requestSubmit());
  await until(() => rejectedPasswordResponse.consumed || issues.length > 0, 'Incorrect-password validation response');
  assert.equal(issues.length, 0, issues[0] || 'Unexpected browser errors');
  assert.equal(rejectedPasswordResponse.consumed, true, 'Expected one POST change-password validation response');
  await until(() => evaluate(() => document.querySelector('#profile-current-password')?.getAttribute('aria-invalid') === 'true'), 'Incorrect current password shows inline validation');
  await ready('.profile-page');
  assert.equal(await evaluate(() => location.pathname), '/profile', 'Incorrect current password navigated away from profile');
  assert.equal(await evaluate(previous => localStorage.getItem('riskops_token') === previous, tokenBeforeRejectedPassword), true, 'Incorrect current password changed the active session');
  assert.equal(await evaluate(() => Boolean(document.querySelector('#profile-current-password-error')?.textContent.trim())), true, 'Current-password field error is missing');
  passwordValidationRegressions++; checks++;
  await fill('#profile-current-password', ''); await fill('#profile-new-password', '');
  await click('.profile-page .password-toggle');
  await until(() => evaluate(() => document.querySelector('#profile-current-password').type === 'text'), 'Password visibility button');
  await click('.profile-page .password-toggle'); await click('.profile-page form button[type="submit"]');
  await until(() => evaluate(() => Boolean(document.querySelector('.profile-page .alert-success'))), 'Profile save'); await ready('.profile-page');
  await click('.notification-button'); await ready('.notifications-page'); await click('.navbar-profile'); await ready('.profile-page');
  await go('/reports', '.reports-page');
  for (let index = 0; index < 3; index++) {
    await evaluate(i => document.querySelectorAll('.reports-page .card-actions button')[i].click(), index);
    await until(() => evaluate(i => document.querySelectorAll('.reports-page .card-actions button')[i].textContent.includes('Actualizar reporte'), index), 'Report generation');
    await ready('.reports-page');
  }
  await go('/users', '.users-page');
  await evaluate(() => [...document.querySelectorAll('.users-page button')].find(button => button.textContent.includes('Nuevo usuario')).click());
  await until(() => evaluate(() => Boolean(document.querySelector('[role="dialog"]')) && document.activeElement.id === 'new-user-full-name'), 'User dialog opens and focuses its first field');
  assert.equal(await evaluate(() => document.activeElement.id), 'new-user-full-name', 'Dialog did not focus its first field');
  assert.equal(await evaluate(() => Boolean(document.querySelector('[role="dialog"] .loading-state'))), false, 'Dialog unexpectedly contains a skeleton');
  await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
  await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
  await until(() => evaluate(() => !document.querySelector('[role="dialog"]')), 'User dialog closes');
  await go('/risk-matrix', '.risk-matrix-page'); await click('.risk-matrix-cell[aria-label^="Probabilidad 5, impacto 5:"]'); await ready('.risks-page');
  assert.equal(await evaluate(() => new URLSearchParams(location.search).get('probability')), '5');
  assert.equal(await evaluate(() => new URLSearchParams(location.search).get('impact')), '5');
  assert.equal(await evaluate(expected => { const rows = [...document.querySelectorAll('.risks-page tbody tr')]; return rows.length === 1 && rows[0].textContent.includes(expected); }, title), true, 'Matrix filter displayed unrelated risks');
  await login(actors.ANALYST.email); await go(`/mitigations?risk_id=${risk.id}`, '.mitigations-page');
  await until(() => evaluate(() => { const select = document.querySelector('.mitigation-plan-form select'); return select && !select.disabled && select.options.length > 1; }), 'Analyst assignees load');
  const planTitle = `Plan navegador ${suffix}`;
  for (const [name, value] of Object.entries({title: planTitle, responsible_user_id: actors.ANALYST.id, start_date: '2030-01-01', due_date: '2030-01-02'})) await fill(`.mitigation-plan-form [name="${name}"]`, value);
  await click('.mitigation-plan-form button[type="submit"]');
  await until(() => evaluate(expected => Boolean(document.querySelector('.mitigations-page tbody')?.textContent.includes(expected)), planTitle), 'Analyst creates a plan through the UI');
  await ready('.mitigations-page');
  assert.ok((await api(`/risks/${risk.id}/mitigation-plans`)).some(plan => plan.title === planTitle && plan.responsible_user_id === actors.ANALYST.id));
  await login(actors.RISK_MANAGER.email); await go('/users', '.users-page');
  assert.equal(await evaluate(() => [...document.querySelectorAll('.users-page button')].some(button => button.textContent.includes('Nuevo usuario'))), false, 'Manager sees an unauthorized create-user action');
  await login(actors.VIEWER.email); await go('/users', '.dashboard-page');
  assert.equal(await evaluate(() => location.pathname), '/dashboard', 'Viewer was not redirected from the user directory');
  assert.equal(issues.length, 0, issues[0] || 'Unexpected browser errors');
  report = {result: 'passed', checks, routes: routes.length, widths: [1440, 390], passwordValidationRegressions, expectedHTTP: expectedResponses.filter(item => item.consumed).length, runtimeErrors: 0, unexpectedHTTP: 0};
}

async function cleanup() {
  if (socket?.readyState === WebSocket.OPEN) await send('Browser.close').catch(() => {});
  socket?.close();
  if (chromeRunning()) {
    const stopped = new Promise(resolve => chrome.once('exit', resolve));
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], {windowsHide: true, stdio: 'ignore'});
      await new Promise(resolve => { killer.once('exit', resolve); killer.once('error', resolve); });
    } else chrome.kill();
    await Promise.race([stopped, pause(3000)]);
    if (chromeRunning()) chrome.kill('SIGKILL');
  }
  if (adminToken) {
    for (const id of riskIds.reverse()) await api(`/risks/${id}`, {method: 'DELETE'}).catch(() => {});
    for (const id of userIds.reverse()) await api(`/users/${id}`, {method: 'DELETE'}).catch(() => {});
  }
  if (profile) {
    const absolute = await fs.realpath(profile), temp = await fs.realpath(os.tmpdir()), relative = path.relative(temp, absolute);
    assert.ok(path.isAbsolute(absolute) && relative && !relative.startsWith('..') && !path.isAbsolute(relative) && path.basename(absolute).startsWith('riskops-browser-'), 'Refusing to remove an unexpected Chrome profile path');
    await fs.rm(absolute, {recursive: true, force: true, maxRetries: 10, retryDelay: 200});
  }
}
run().catch(error => { console.error(`Browser smoke failed: ${error.message}`); process.exitCode = 1; })
  .finally(() => cleanup().catch(() => { console.error('Browser smoke cleanup failed.'); process.exitCode = 1; }))
  .then(() => { if (!process.exitCode) console.log(JSON.stringify(report)); });
