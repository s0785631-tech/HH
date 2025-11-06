const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { documentType, documentNumber, password } = req.body;

    // First, try to find user in database
    const dbUser = await User.findOne({ email: documentNumber });

    if (dbUser) {
      // User exists in database, validate password
      const isValidPassword = await bcrypt.compare(password, dbUser.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { userId: dbUser._id, role: dbUser.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: dbUser._id,
          name: dbUser.name,
          role: dbUser.role
        }
      });
    }

    // If not in database, check mock users (for development)
    const mockUsers = [
      { documentNumber: '12345678', password: '12345678', role: 'empresa', name: 'Director General' },
      { documentNumber: '87654321', password: '87654321', role: 'recepcion', name: 'Ana García' },
      { documentNumber: '11111111', password: '11111111', role: 'consultorio', name: 'Dr. Carlos Mendez' },
      { documentNumber: '22222222', password: '22222222', role: 'enfermeria', name: 'Enf. María López' },
    ];

    const mockUser = mockUsers.find(u => u.documentNumber === documentNumber && u.password === password);

    if (!mockUser) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: mockUser.documentNumber, role: mockUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: mockUser.documentNumber,
        name: mockUser.name,
        role: mockUser.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
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