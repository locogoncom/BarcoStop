const {verifyToken} = require('../utils/token');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({error: 'Token requerido'});
  }

  try {
    const payload = verifyToken(token);
    req.auth = {
      userId: String(payload.userId || ''),
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (err) {
    return res.status(401).json({error: err.message || 'Token inválido'});
  }
};

module.exports = requireAuth;
