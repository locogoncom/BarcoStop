const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {randomUUID} = require('crypto');
const router = express.Router();
const User = require('../models/User');
const {createToken} = require('../utils/token');
const requireAuth = require('../middleware/requireAuth');

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

const updateUserHandler = async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado para actualizar perfil' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// register new user
router.post('/', async (req, res) => {
  try {
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
    const { email, role } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role && user.role !== role) {
      return res.status(400).json({ error: 'Rol no coincide con el usuario' });
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
router.delete('/:id', async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add rating to user
router.post('/:id/ratings', async (req, res) => {
  try {
    const user = await User.addRating(req.params.id, req.body);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;