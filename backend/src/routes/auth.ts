import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
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

export default router;