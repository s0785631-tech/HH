import express from 'express';
import Appointment from '../models/Appointment';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get appointments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado } = req.query;
    let filter: any = {};
    
    if (fecha) {
      const startDate = new Date(fecha as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fecha = { $gte: startDate, $lt: endDate };
    }
    
    if (estado) {
      filter.estado = estado;
    }

    const appointments = await Appointment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula telefono')
      .populate('medicoId', 'name')
      .sort({ fecha: 1, hora: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      createdBy: req.user.userId
    });
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('pacienteId', 'nombre apellido cedula telefono')
      .populate('medicoId', 'name');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
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

export default router;