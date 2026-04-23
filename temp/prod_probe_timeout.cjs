const fs = require('fs');
const path = require('path');

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, {...options, signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

async function readResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function postJson(url, body, token) {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify(body),
  });
  return {status: res.status, body: await readResponse(res)};
}

async function postAvatar(url, token) {
  const filePath = path.join(__dirname, 'avatar-probe.png');
  if (!fs.existsSync(filePath)) {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0KJ4AAAAASUVORK5CYII=';
    fs.writeFileSync(filePath, Buffer.from(pngBase64, 'base64'));
  }
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)], {type: 'image/png'});
  form.append('avatar', blob, 'avatar-probe.png');

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: form,
  });
  return {status: res.status, body: await readResponse(res)};
}

async function main() {
  const base = 'https://locogon.onrender.com/api';
  const suffix = Math.floor(Math.random() * 1e9);
  const email1 = `probe.chat.a.${suffix}@example.com`;
  const email2 = `probe.chat.b.${suffix}@example.com`;

  console.log('STEP register-1');
  const reg1 = await postJson(`${base}/users`, {name: 'Probe A', email: email1, password: '1234', role: 'viajero'});
  console.log('STEP register-2');
  const reg2 = await postJson(`${base}/users`, {name: 'Probe B', email: email2, password: '1234', role: 'viajero'});
  console.log('STEP login');
  const login = await postJson(`${base}/users/login`, {email: email1, password: '1234'});
  const token = login.body && typeof login.body === 'object' ? login.body.token : undefined;
  const user1 = reg1.body;
  const user2 = reg2.body;
  console.log('STEP conversation');
  const conversation = await postJson(`${base}/messages/conversation`, {userId1: user1 && user1.id, userId2: user2 && user2.id}, token);
  console.log('STEP avatar');
  const avatar = await postAvatar(`${base}/users/${user1 && user1.id}/avatar`, token);
  console.log(JSON.stringify({reg1, reg2, login, conversation, avatar}, null, 2));
}

main().catch(error => {
  console.error('PROBE_ERROR');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
