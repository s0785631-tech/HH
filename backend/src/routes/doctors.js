const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching all doctors...');
    const doctors = await Doctor.find({ isActive: true })
      .populate('userId', 'email name')
      .sort({ apellido: 1, nombre: 1 });
    
    // Agregar información completa del doctor para el frontend
    const doctorsWithFullInfo = doctors.map(doctor => ({
      ...doctor.toObject(),
      displayName: `Dr. ${doctor.nombre} ${doctor.apellido}`,
      fullInfo: `Dr. ${doctor.nombre} ${doctor.apellido} - ${doctor.especialidad}`
    }));
    
    console.log(`Found ${doctorsWithFullInfo.length} doctors`);
    res.json(doctorsWithFullInfo);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get doctor by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'email name');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get available doctors for a specific date and time
router.get('/available/:fecha/:hora', authMiddleware, async (req, res) => {
  try {
    const { fecha, hora } = req.params;
    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    const doctors = await Doctor.find({
      isActive: true,
      'horarios.dia': diaSemana,
      'horarios.activo': true,
      $expr: {
        $and: [
          { $lte: [{ $arrayElemAt: ['$horarios.horaInicio', 0] }, hora] },
          { $gte: [{ $arrayElemAt: ['$horarios.horaFin', 0] }, hora] }
        ]
      }
    }).populate('userId', 'name');
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Validar contraseña fuerte para doctores
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  if (!hasLowerCase) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  if (!hasNumbers) {
    errors.push('La contraseña debe contener al menos un número');
  }
  if (!hasSpecialChar) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Validar horarios del doctor
const validateDoctorSchedule = (horarios) => {
  const errors = [];
  
  if (!horarios || horarios.length === 0) {
    errors.push('Debe definir al menos un horario de trabajo');
    return { isValid: false, errors };
  }
  
  const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  
  horarios.forEach((horario, index) => {
    if (!diasValidos.includes(horario.dia)) {
      errors.push(`Día inválido en horario ${index + 1}: ${horario.dia}`);
    }
    
    if (!horario.horaInicio || !horario.horaFin) {
      errors.push(`Horario ${index + 1}: Debe especificar hora de inicio y fin`);
    } else {
      // Validar formato de hora (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horario.horaInicio)) {
        errors.push(`Horario ${index + 1}: Formato de hora de inicio inválido (use HH:MM)`);
      }
      if (!timeRegex.test(horario.horaFin)) {
        errors.push(`Horario ${index + 1}: Formato de hora de fin inválido (use HH:MM)`);
      }
      
      // Validar que hora fin sea mayor que hora inicio
      if (horario.horaInicio >= horario.horaFin) {
        errors.push(`Horario ${index + 1}: La hora de fin debe ser mayor que la hora de inicio`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Create doctor (only empresa role)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating doctor with data:', req.body);
    console.log('User role:', req.user.role);
    
    // Verificar que el usuario tenga rol de empresa
    if (req.user.role !== 'empresa') {
      console.log('Access denied - user role is not empresa');
      return res.status(403).json({ message: 'No autorizado' });
    }

    const {
      nombre,
      apellido,
      cedula,
      especialidad,
      numeroLicencia,
      telefono,
      email,
      consultorio,
      horarios,
      password
    } = req.body;

    console.log('Extracted data:', {
      nombre, apellido, cedula, especialidad, numeroLicencia, telefono, email, consultorio, horarios
    });

    // Validar campos requeridos
    if (!nombre || !apellido || !cedula || !especialidad || !numeroLicencia || !telefono || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar contraseña fuerte
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
    }

    // Validar horarios
    const scheduleValidation = validateDoctorSchedule(horarios);
    if (!scheduleValidation.isValid) {
      return res.status(400).json({ 
        message: 'Horarios inválidos',
        errors: scheduleValidation.errors
      });
    }

    // Verificar si ya existe un doctor con la misma cédula
    const existingDoctor = await Doctor.findOne({ cedula });
    if (existingDoctor) {
      console.log('Doctor with cedula already exists:', cedula);
      return res.status(400).json({ message: 'Ya existe un doctor con esta cédula' });
    }

    // Verificar si ya existe un usuario con el mismo email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User with email already exists:', email);
      return res.status(400).json({ message: 'Ya existe un usuario con este email' });
    }
    // Crear usuario para el doctor
    console.log('Creating user for doctor...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      cedula,
      password: hashedPassword,
      role: 'doctor',
      name: `Dr. ${nombre} ${apellido}`
    });
    
    const savedUser = await user.save();
    console.log('User created successfully:', savedUser._id);

    // Crear doctor
    console.log('Creating doctor record...');
    const doctor = new Doctor({
      userId: savedUser._id,
      nombre,
      apellido,
      cedula,
      especialidad,
      numeroLicencia,
      telefono,
      email,
      consultorio,
      horarios: horarios
    });
    
    const savedDoctor = await doctor.save();
    console.log('Doctor created successfully:', savedDoctor._id);

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('userId', 'email name');
    
    console.log('Doctor creation completed successfully');
    
    res.status(201).json(populatedDoctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'cedula' ? 'Ya existe un doctor con esta cédula' : 
                     field === 'numeroLicencia' ? 'Ya existe un doctor con este número de licencia' :
                     field === 'email' ? 'Ya existe un usuario con este email' :
                     'Ya existe un registro con estos datos';
      res.status(400).json({ message });
    } else {
      res.status(500).json({ 
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Update doctor
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'email name');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get doctor's schedule for a specific date
router.get('/:id/horarios/:fecha', authMiddleware, async (req, res) => {
  try {
    const { id, fecha } = req.params;
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    const horarioDelDia = doctor.horarios.find(h => h.dia === diaSemana && h.activo);
    
    if (!horarioDelDia) {
      return res.json({ disponible: false, mensaje: 'Doctor no disponible este día' });
    }

    // Obtener citas existentes para ese día
    const Appointment = require('../models/Appointment');
    const citasExistentes = await Appointment.find({
      medicoId: doctor.userId,
      fecha: {
        $gte: new Date(fecha),
        $lt: new Date(new Date(fecha).getTime() + 24 * 60 * 60 * 1000)
      },
      estado: { $nin: ['cancelada'] }
    });

    const horasOcupadas = citasExistentes.map(cita => cita.hora);
    
    res.json({
      disponible: true,
      horario: horarioDelDia,
      horasOcupadas
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Delete doctor (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    
    res.json({ message: 'Doctor eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;