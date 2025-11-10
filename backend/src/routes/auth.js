const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body;

    console.log('Login attempt:', { cedula });

    // Buscar usuario por cédula
    let dbUser = await User.findOne({ 
      cedula: cedula
    });
    

    if (dbUser) {
      // User exists in database, validate password
      const isValidPassword = await bcrypt.compare(password, dbUser.password);

      if (!isValidPassword) {
        console.log('Invalid password for user:', cedula);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { userId: dbUser._id, role: dbUser.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      console.log('Login successful for user:', dbUser.cedula);
      return res.json({
        token,
        user: {
          id: dbUser._id,
          name: dbUser.name,
          role: dbUser.role
        }
      });
    }

    // Verificar si es un doctor registrado
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ cedula: cedula }).populate('userId');
    
    if (doctor && doctor.userId) {
      const isValidPassword = await bcrypt.compare(password, doctor.userId.password);
      
      if (isValidPassword) {
        const token = jwt.sign(
          { userId: doctor.userId._id, role: 'doctor', doctorId: doctor._id },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '8h' }
        );

        console.log('Doctor login successful:', doctor.cedula);
        return res.json({
          token,
          user: {
            id: doctor.userId._id,
            name: `Dr. ${doctor.nombre} ${doctor.apellido}`,
            role: 'doctor',
            doctorInfo: {
              doctorId: doctor._id,
              cedula: doctor.cedula,
              nombre: doctor.nombre,
              apellido: doctor.apellido,
              especialidad: doctor.especialidad,
              numeroLicencia: doctor.numeroLicencia,
              consultorio: doctor.consultorio,
              telefono: doctor.telefono,
              email: doctor.email
            }
          }
        });
      }
    }

    // Si no existe en la base de datos, crear usuarios por defecto si es necesario
    const mockUsers = [
      { cedula: '12345678', password: '12345678', role: 'empresa', name: 'Director General', email: 'empresa@saviser.com' },
      { cedula: '87654321', password: '87654321', role: 'recepcion', name: 'Ana García', email: 'recepcion@saviser.com' },
      { cedula: '11111111', password: '11111111', role: 'consultorio', name: 'Dr. Carlos Mendez', email: 'consultorio@saviser.com' },
      { cedula: '22222222', password: '22222222', role: 'enfermeria', name: 'Enf. María López', email: 'enfermeria@saviser.com' },
    ];

    const mockUser = mockUsers.find(u => u.cedula === cedula && u.password === password);

    if (!mockUser) {
      console.log('User not found:', cedula);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Crear el usuario en la base de datos si no existe
    try {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const newUser = new User({
        email: mockUser.email,
        cedula: mockUser.cedula,
        password: hashedPassword,
        role: mockUser.role,
        name: mockUser.name
      });
      await newUser.save();
      
      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      console.log('Created and logged in user:', mockUser.cedula);
      return res.json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          role: newUser.role
        }
      });
    } catch (createError) {
      console.error('Error creating user:', createError);
    }

    // Fallback: login temporal sin crear usuario
    const token = jwt.sign(
      { userId: mockUser.cedula, role: mockUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    console.log('Temporary login for:', mockUser.cedula);
    res.json({
      token,
      user: {
        id: mockUser.cedula,
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
    const { name, email, cedula, password, role } = req.body;

    console.log('Register attempt:', { name, email, cedula, role });

    const existingUser = await User.findOne({ 
      $or: [{ email }, { cedula }]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo o cédula ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      cedula,
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

    console.log('User registered successfully:', cedula);
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