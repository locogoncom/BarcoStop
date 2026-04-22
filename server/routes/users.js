// ...existing code...


const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {randomUUID} = require('crypto');
const router = express.Router();
const User = require('../models/User');
const {createToken} = require('../utils/token');
const requireAuth = require('../middleware/requireAuth');

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'captain' || value === 'capitan' || value === 'patrón' || value === 'patron') {
    return 'patron';
  }
  if (value === 'traveler' || value === 'traveller' || value === 'viajero' || value === 'viajera') {
    return 'viajero';
  }
  return null;
};

const toUploadPath = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return undefined;
  if (raw.startsWith('/uploads/')) return raw;
  if (/^uploads\//i.test(raw)) return `/${raw}`;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const normalizedPath = parsed.pathname.replace(/^\/api(?=\/uploads\/)/i, '');
      if (normalizedPath.startsWith('/uploads/')) {
        return normalizedPath;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const sanitizeUserPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const normalizedAvatar = toUploadPath(payload.avatar);
  return {
    ...payload,
    ...(payload.avatar !== undefined ? {avatar: normalizedAvatar || payload.avatar} : {}),
  };
};

const avatarUploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(avatarUploadDir, {recursive: true});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadDir),
  filename: (_req, file, cb) => {
    const extByMime = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extByMime[file.mimetype] || path.extname(file.originalname || '') || '.jpg';
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('Formato de imagen no permitido. Usa JPG, PNG o WEBP.'));
      return;
    }
    cb(null, true);
  },
});

// register new user
router.post('/', async (req, res) => {
  try {
    if (!req.body.password || req.body.password.length < 4) {
      return res.status(400).json({ error: 'La contraseña es requerida y debe tener al menos 4 caracteres.' });
    }
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('User creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// list users
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    const users = await User.findAll(filters);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const normalizedRoleHint = normalizeRole(role);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await User.validatePassword(email, password);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    return res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token: createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
      roleHintIgnored: Boolean(normalizedRoleHint && user.role !== normalizedRoleHint),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const updateUserHandler = async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.params.id || '')) {
      return res.status(403).json({ error: 'No autorizado para actualizar este usuario' });
    }
    const user = await User.update(req.params.id, sanitizeUserPayload(req.body));
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado para actualizar perfil' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// update user
router.patch('/:id', requireAuth, updateUserHandler);
router.put('/:id', requireAuth, updateUserHandler);

const handleAvatarUpload = async (req, res) => {
  try {
    const {id} = req.params;

    if (!req.auth?.userId || req.auth.userId !== id) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(403).json({error: 'No autorizado para actualizar este avatar'});
    }

    if (!req.file) {
      return res.status(400).json({error: 'No se recibio imagen'});
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await User.update(id, {avatar: avatarPath});
    if (!user) {
      fs.unlink(req.file.path, () => {});
      return res.sendStatus(404);
    }

    return res.status(201).json({avatar: avatarPath, user});
  } catch (err) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(400).json({error: err.message});
  }
};

// upload avatar image
router.post('/:id/avatar', requireAuth, uploadAvatar.single('avatar'), handleAvatarUpload);
router.post('/avatar/:id', requireAuth, uploadAvatar.single('avatar'), handleAvatarUpload);

// delete user
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.params.id || '')) {
      return res.status(403).json({ error: 'No autorizado para eliminar este usuario' });
    }
    await User.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add rating to user
router.post('/:id/ratings', requireAuth, async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.body?.ratedBy || '')) {
      return res.status(403).json({ error: 'No autorizado para calificar en nombre de otro usuario' });
    }
    const user = await User.addRating(req.params.id, req.body);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;