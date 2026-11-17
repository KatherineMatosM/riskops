/* Runs only against the disposable stack in docker-compose.test.yml. */
const assert = require('node:assert/strict');

const API = process.env.SMOKE_API_URL || 'http://localhost:18000/api/v1';
const WEB = process.env.SMOKE_WEB_URL || 'http://localhost:13000';
const PASSWORD = 'Password-CI!2026';
const suffix = Date.now().toString(36);
let checks = 0;

async function request(path, {token, method = 'GET', body, status = 200} = {}) {
  const response = await fetch(API + path, {
    method,
    headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), ...(body ? {'Content-Type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, `${method} ${path}: expected ${status}, received ${response.status}`);
  const result = await response.json();
  assert.equal(result.success, status < 400, `${method} ${path}: invalid response envelope`);
  checks++;
  return status < 400 ? result.data : result;
}

async function login(email, password = PASSWORD) {
  return request('/auth/login', {method: 'POST', body: {email, password}});
}

async function run() {
  assert.equal(process.env.SMOKE_ALLOW_WRITES, 'true', 'Set SMOKE_ALLOW_WRITES=true only for the disposable test stack.');
  const target = new URL(API);
  assert.ok(['localhost', '127.0.0.1'].includes(target.hostname) && target.port === '18000',
    'Smoke mutations are restricted to the isolated API on localhost:18000.');

  for (const route of ['/', '/login', '/risks']) {
    const response = await fetch(WEB + route);
    assert.equal(response.status, 200, `Frontend route ${route} is unavailable`);
    assert.match(await response.text(), /<div id="root"><\/div>/, 'Missing frontend application shell');
    checks++;
  }
  const health = await fetch(new URL('/health', API));
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  checks++;
  await request('/risks', {status: 401});

  const admin = await login('ci-admin@example.com', 'RiskOps-CI-admin!2026');
  const adminToken = admin.access_token;
  assert.ok(admin.user.roles.includes('ADMIN'));
  assert.equal((await request('/auth/me', {token: adminToken})).id, admin.user.id);
  const categories = await request('/risk-categories', {token: adminToken});
  assert.ok(categories.length > 0, 'Bootstrap did not seed categories');
  assert.equal(categories.length, new Set(categories.map(category => category.name)).size);
  const proxy = await fetch(WEB + '/api/v1/risk-categories', {headers: {Authorization: `Bearer ${adminToken}`}});
  assert.equal(proxy.status, 200, 'Frontend API proxy is unavailable');
  assert.ok((await proxy.json()).data.length > 0);
  checks++;

  const actors = {};
  for (const role of ['ANALYST', 'VIEWER', 'RISK_MANAGER']) {
    const email = `ci-${role.toLowerCase()}-${suffix}@example.com`;
    const user = await request('/users', {token: adminToken, method: 'POST', body: {
      full_name: `Usuario CI ${role}`, email, password: PASSWORD, roles: [role],
    }});
    actors[role] = {user, ...(await login(email))};
  }
  const analyst = actors.ANALYST.access_token;
  const viewer = actors.VIEWER.access_token;
  const manager = actors.RISK_MANAGER.access_token;
  await request('/users', {token: analyst, status: 403});
  await request('/users/assignees', {token: viewer, status: 403});
  const options = await request('/users/assignees', {token: analyst});
  assert.ok(options.some(option => option.id === actors.ANALYST.user.id));
  assert.ok(options.every(option => Object.keys(option).sort().join(',') === 'full_name,id'));
  await request('/users', {token: manager, method: 'POST', status: 403, body: {
    full_name: 'No autorizado', email: `blocked-${suffix}@example.com`, password: PASSWORD,
  }});

  const category = await request('/risk-categories', {token: manager, method: 'POST', body: {
    name: `Categoria CI ${suffix}`, description: 'Creada por la prueba de integración',
  }});
  const otherCategory = await request('/risk-categories', {token: manager, method: 'POST', body: {name: `Otra CI ${suffix}`}});
  await request(`/risk-categories/${otherCategory.id}`, {token: manager, method: 'PUT', status: 409, body: {name: category.name}});
  const cleared = await request(`/risk-categories/${category.id}`, {token: manager, method: 'PUT', body: {description: null}});
  assert.equal(cleared.description, null);

  const risk = await request('/risks', {token: analyst, method: 'POST', body: {
    title: `Riesgo CI ${suffix}`, category_id: category.id, probability: 2, impact: 3,
    responsible_user_id: actors.ANALYST.user.id,
  }});
  assert.equal(risk.risk_score, 6);
  await request(`/risk-categories/${category.id}`, {token: adminToken, method: 'DELETE', status: 409});
  await request(`/users/${actors.ANALYST.user.id}`, {token: adminToken, method: 'DELETE', status: 409});
  assert.equal((await request('/auth/me', {token: analyst})).id, actors.ANALYST.user.id);
  await request(`/risks/${risk.id}`, {token: viewer});
  await request(`/risks/${risk.id}`, {token: viewer, method: 'PUT', status: 403, body: {title: 'No autorizado'}});
  const updated = await request(`/risks/${risk.id}`, {token: analyst, method: 'PUT', body: {probability: 5, impact: 5}});
  assert.equal(updated.risk_score, 25);
  assert.equal(updated.risk_level, 'CRITICAL');
  const evaluations = await request(`/risks/${risk.id}/evaluations`, {token: analyst});
  assert.equal(evaluations.length, 1);
  await request(`/risks/${risk.id}`, {token: analyst, method: 'PUT', body: {probability: 5, impact: 5}});
  assert.equal((await request(`/risks/${risk.id}/evaluations`, {token: analyst})).length, 1);
  const invalid = await request(`/risks/${risk.id}`, {token: analyst, method: 'PUT', status: 422, body: {probability: 6}});
  assert.ok(invalid.errors.some(error => error.field === 'probability'));

  const plan = await request(`/risks/${risk.id}/mitigation-plans`, {token: analyst, method: 'POST', body: {
    title: `Plan CI ${suffix}`, responsible_user_id: actors.ANALYST.user.id,
    start_date: '2000-01-01', due_date: '2000-01-02',
  }});
  assert.equal((await request('/dashboard/summary', {token: analyst})).overdue_mitigation_plans, 1);
  const graph = await request('/dashboard/mitigations-by-status', {token: analyst});
  assert.equal(graph.find(point => point.label === 'OVERDUE').value, 1);
  assert.ok((await request('/analytics', {token: analyst})).overdue_mitigations.some(item => item.id === plan.id));
  await request(`/mitigation-plans/${plan.id}`, {token: analyst, method: 'PUT', status: 422, body: {due_date: '1999-12-31'}});
  const action = await request(`/mitigation-plans/${plan.id}/actions`, {token: analyst, method: 'POST', body: {
    title: `Accion CI ${suffix}`, responsible_user_id: actors.ANALYST.user.id, due_date: '2000-01-02',
  }});
  const completed = await request(`/mitigation-actions/${action.id}`, {token: analyst, method: 'PUT', body: {status: 'COMPLETED'}});
  const repeated = await request(`/mitigation-actions/${action.id}`, {token: analyst, method: 'PUT', body: {status: 'COMPLETED'}});
  assert.ok(completed.completed_at);
  assert.equal(repeated.completed_at, completed.completed_at);
  await request(`/mitigation-plans/${plan.id}`, {token: analyst, method: 'PUT', body: {progress: 100}});
  assert.equal((await request('/dashboard/summary', {token: analyst})).overdue_mitigation_plans, 0);

  for (const route of ['/dashboard/risks-by-level', '/dashboard/risks-by-category', '/dashboard/risks-by-status',
    '/dashboard/risk-trend', '/dashboard/risk-matrix', '/reports/risks', '/reports/critical-risks', '/reports/mitigations']) {
    const data = await request(route, {token: viewer});
    assert.ok(Array.isArray(data), `Unexpected report/chart data: ${route}`);
  }
  const matrix = await request('/dashboard/risk-matrix', {token: viewer});
  assert.ok(matrix.find(cell => cell.probability === 5 && cell.impact === 5).risk_ids.includes(risk.id));
  const notifications = await request('/notifications', {token: analyst});
  const critical = notifications.find(item => item.type === 'RISK_CRITICAL');
  assert.ok(critical, 'Missing critical-risk notification');
  await request(`/notifications/${critical.id}/read`, {token: analyst, method: 'PUT'});

  await request('/users/me/profile', {token: analyst, method: 'PUT', body: {full_name: 'Analista de integración actualizado'}});
  assert.equal((await request('/auth/me', {token: analyst})).full_name, 'Analista de integración actualizado');
  await request(`/mitigation-actions/${action.id}`, {token: manager, method: 'DELETE'});
  await request(`/mitigation-plans/${plan.id}`, {token: manager, method: 'DELETE'});
  await request(`/risks/${risk.id}`, {token: manager, method: 'DELETE'});
  await request(`/risks/${risk.id}`, {token: viewer, status: 404});
  await request(`/risk-categories/${category.id}`, {token: adminToken, method: 'DELETE'});
  await request(`/risk-categories/${otherCategory.id}`, {token: adminToken, method: 'DELETE'});

  const changedPassword = 'Password-CI-updated!2026';
  const passwordError = await request('/auth/change-password', {token: viewer, method: 'POST', status: 422, body: {
    current_password: 'Incorrect-password!2026', new_password: changedPassword,
  }});
  assert.equal(passwordError.error_code, 'INVALID_CURRENT_PASSWORD');
  assert.ok(passwordError.errors.some(error => error.field === 'current_password'));
  assert.equal((await request('/auth/me', {token: viewer})).id, actors.VIEWER.user.id);
  await request('/auth/change-password', {token: viewer, method: 'POST', body: {
    current_password: PASSWORD, new_password: changedPassword,
  }});
  await request('/auth/login', {method: 'POST', status: 401, body: {email: actors.VIEWER.user.email, password: PASSWORD}});
  assert.ok((await login(actors.VIEWER.user.email, changedPassword)).user.roles.includes('VIEWER'));

  console.log(JSON.stringify({result: 'passed', checks, stack: 'disposable SQL Server + backend + frontend'}));
}

run().catch(error => {console.error(error.message); process.exitCode = 1;});
