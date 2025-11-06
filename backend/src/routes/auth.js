const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { documentType, documentNumber } = req.body;

    // For development, use mock authentication
    const mockUsers = [
      { documentNumber: '12345678', role: 'empresa', name: 'Director General' },
      { documentNumber: '87654321', role: 'recepcion', name: 'Ana García' },
      { documentNumber: '11111111', role: 'consultorio', name: 'Dr. Carlos Mendez' },
      { documentNumber: '22222222', role: 'enfermeria', name: 'Enf. María López' },
    ];

    const user = mockUsers.find(u => u.documentNumber === documentNumber);
    if (!user) {
      return res.status(401).json({ message: 'Documento no encontrado' });
    }

    const token = jwt.sign(
      { userId: user.documentNumber, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.documentNumber,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, documentType, documentNumber, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      name
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create initial users (for development)
router.post('/seed', async (req, res) => {
  try {
    const users = [
      { email: 'empresa@saviser.com', password: 'empresa123', role: 'empresa', name: 'Director General' },
      { email: 'recepcion@saviser.com', password: 'recepcion123', role: 'recepcion', name: 'Ana García' },
      { email: 'consultorio@saviser.com', password: 'consultorio123', role: 'consultorio', name: 'Dr. Carlos Mendez' },
      { email: 'enfermeria@saviser.com', password: 'enfermeria123', role: 'enfermeria', name: 'Enf. María López' },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword
        });
      }
    }

    res.json({ message: 'Usuarios creados exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;