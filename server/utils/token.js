const crypto = require('crypto');

const base64UrlEncode = (input) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (input) => {
  const normalized = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
};

const sign = (value, secret) => {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(value).digest());
};

const getSecret = () => {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret || String(secret).trim().length < 24) {
    throw new Error('AUTH_TOKEN_SECRET/JWT_SECRET no configurado o demasiado debil (min 24 chars)');
  }
  return secret;
};

const createToken = (payload, expiresInSeconds = 60 * 60 * 24 * 7) => {
  const header = {alg: 'HS256', typ: 'JWT'};
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedBody}`, getSecret());
  return `${encodedHeader}.${encodedBody}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato de token inválido');
  }

  const [encodedHeader, encodedBody, signature] = parts;
  const expected = sign(`${encodedHeader}.${encodedBody}`, getSecret());

  if (signature !== expected) {
    throw new Error('Firma de token inválida');
  }

  const payload = JSON.parse(base64UrlDecode(encodedBody));
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || now >= payload.exp) {
    throw new Error('Token expirado');
  }

  return payload;
};

module.exports = {
  createToken,
  verifyToken,
};
