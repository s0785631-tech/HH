const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate('userId', 'email name')
      .sort({ apellido: 1, nombre: 1 });
    res.json(doctors);
  } catch (error) {
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

// Create doctor (only empresa role)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Verificar que el usuario tenga rol de empresa
    if (req.user.role !== 'empresa') {
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

    // Crear usuario para el doctor
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: 'consultorio',
      name: `Dr. ${nombre} ${apellido}`
    });
    await user.save();

    // Crear doctor
    const doctor = new Doctor({
      userId: user._id,
      nombre,
      apellido,
      cedula,
      especialidad,
      numeroLicencia,
      telefono,
      email,
      consultorio,
      horarios
    });
    await doctor.save();

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('userId', 'email name');
    
    res.status(201).json(populatedDoctor);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe un doctor con esta cédula o número de licencia' });
    } else {
      res.status(500).json({ message: 'Error del servidor' });
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

module.exports = router;