const express = require('express');
const Appointment = require('../models/Appointment');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get appointments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado } = req.query;
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

    const appointments = await Appointment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula telefono')
      .populate({
        path: 'medicoId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ fecha: 1, hora: 1 });
    
    // Transform the response to match expected format
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment.toObject(),
      medicoId: {
        _id: appointment.medicoId._id,
        name: appointment.medicoId.userId ? appointment.medicoId.userId.name : `Dr. ${appointment.medicoId.nombre} ${appointment.medicoId.apellido}`
      }
    }));
    
    res.json(transformedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Find the doctor to get the userId
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findById(req.body.medicoId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const appointment = new Appointment({
      ...req.body,
      medicoId: doctor.userId, // Use the doctor's userId for the appointment
      createdBy: req.user.userId
    });
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('pacienteId', 'nombre apellido cedula telefono')
      .populate('medicoId', 'name');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('pacienteId', 'nombre apellido cedula telefono')
     .populate('medicoId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;