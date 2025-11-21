const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validar horario del doctor
const validateDoctorSchedule = async (doctorId, fecha, hora) => {
  try {
    // Buscar doctor por userId (que es lo que recibimos como medicoId)
    const doctor = await Doctor.findOne({ userId: doctorId, isActive: true });
    if (!doctor) {
      return { valid: false, message: 'Doctor no encontrado o inactivo' };
    }

    console.log('Validating schedule for doctor:', doctor.nombre, doctor.apellido);
    
    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    const horarioDelDia = doctor.horarios.find(h => h.dia === diaSemana && h.activo);
    
    if (!horarioDelDia) {
      return { valid: false, message: `Dr. ${doctor.nombre} ${doctor.apellido} no está disponible los ${diaSemana}s` };
    }

    // Verificar si la hora está dentro del horario
    const horaInicio = horarioDelDia.horaInicio;
    const horaFin = horarioDelDia.horaFin;
    
    if (hora < horaInicio || hora > horaFin) {
      return { valid: false, message: `Dr. ${doctor.nombre} ${doctor.apellido} está disponible de ${horaInicio} a ${horaFin}` };
    }

    // Verificar si ya tiene cita a esa hora
    const citaExistente = await Appointment.findOne({
      medicoId: doctorId,
      fecha: {
        $gte: new Date(fecha),
        $lt: new Date(new Date(fecha).getTime() + 24 * 60 * 60 * 1000)
      },
      hora: hora,
      estado: { $nin: ['cancelada'] }
    });

    if (citaExistente) {
      return { valid: false, message: `Dr. ${doctor.nombre} ${doctor.apellido} ya tiene una cita programada a las ${hora}` };
    }

    return { valid: true, doctor };
  } catch (error) {
    return { valid: false, message: 'Error validando horario del doctor' };
  }
};

// Get appointments for specific doctor
router.get('/doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { fecha, estado } = req.query;
    
    let filter = { medicoId: doctorId };

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fecha = { $gte: startDate, $lt: endDate };
    }

    if (estado) {
      filter.estado = estado;
    }

    const appointments = await Appointment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula telefono tipoAfiliacion')
      .populate({
        path: 'medicoId',
        select: 'name'
      })
      .sort({ fecha: 1, hora: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get appointments assigned to logged doctor
router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado } = req.query;
    let filter = { medicoId: req.user.userId };

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fecha = { $gte: startDate, $lt: endDate };
    }

    if (estado) {
      filter.estado = estado;
    }

    const appointments = await Appointment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula telefono tipoAfiliacion copago')
      .populate({
        path: 'medicoId',
        select: 'name'
      })
      .sort({ fecha: 1, hora: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching my appointments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get appointments
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching all appointments with filters:', req.query);
    const { fecha, estado, pacienteId, medicoId } = req.query;
    let filter = {};

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fecha = { $gte: startDate, $lt: endDate };
    }

    if (estado) {
      filter.estado = estado;
    }

    if (pacienteId) {
      filter.pacienteId = pacienteId;
    }

    if (medicoId) {
      filter.medicoId = medicoId;
    }

    const appointments = await Appointment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula telefono')
      .populate('medicoId', 'name')
      .sort({ fecha: 1, hora: 1 });

    console.log(`Found ${appointments.length} total appointments`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating appointment with data:', req.body);
    console.log('User from token:', req.user);
    
    const { pacienteId, medicoId, fecha, hora, motivo, notas } = req.body;
    
    // Validar que se proporcione el medicoId
    if (!medicoId) {
      return res.status(400).json({ message: 'Debe seleccionar un médico' });
    }
    
    // Verificar que el médico existe y está activo
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: medicoId, isActive: true });
    if (!doctor) {
      return res.status(400).json({ message: 'Médico no encontrado o inactivo' });
    }
    
    // Validar horario del doctor
    const scheduleValidation = await validateDoctorSchedule(medicoId, fecha, hora);
    if (!scheduleValidation.valid) {
      return res.status(400).json({ message: scheduleValidation.message });
    }
    
    // Obtener información del paciente para calcular copago
    const Patient = require('../models/Patient');
    const patient = await Patient.findById(pacienteId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    
    let copago = 0;
    let pagoCopago = true; // Por defecto pagado para subsidiado
    
    if (patient && patient.tipoAfiliacion === 'contributivo') {
      copago = 15000; // Copago obligatorio para régimen contributivo
      pagoCopago = false; // Debe pagar antes de la cita
    }
    
    const appointment = new Appointment({
      pacienteId,
      medicoId, // Este es el userId del doctor, no el doctorId
      fecha,
      hora,
      motivo,
      notas,
      createdBy: req.user.userId,
      copago: copago,
      pagoCopago: pagoCopago
    });
    
    console.log('Appointment to save:', appointment);
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('pacienteId', 'nombre apellido cedula telefono tipoAfiliacion')
      .populate('medicoId', 'name email');
    
    console.log('Populated appointment:', populatedAppointment);
    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Update payment status
router.put('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { pagoCopago } = req.body;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    // Verificar que el usuario tenga permisos (recepción o empresa)
    if (!['recepcion', 'empresa'].includes(req.user.role)) {
      return res.status(403).json({ message: 'No autorizado para actualizar pagos' });
    }
    
    appointment.pagoCopago = pagoCopago;
    if (pagoCopago) {
      appointment.fechaPago = new Date();
    }
    
    await appointment.save();
    
    const updatedAppointment = await Appointment.findById(id)
      .populate('pacienteId', 'nombre apellido cedula telefono tipoAfiliacion')
      .populate('medicoId', 'name');
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { fecha, hora, medicoId } = req.body;
    
    // Si se está cambiando fecha, hora o médico, validar horario
    if (fecha && hora && medicoId) {
      const scheduleValidation = await validateDoctorSchedule(medicoId, fecha, hora);
      if (!scheduleValidation.valid) {
        return res.status(400).json({ message: scheduleValidation.message });
      }
    }
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('pacienteId', 'nombre apellido cedula telefono tipoAfiliacion')
     .populate('medicoId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Delete appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    res.json({ message: 'Cita eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;