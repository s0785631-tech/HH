import express from 'express';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Triage from '../models/Triage';
import Consultation from '../models/Consultation';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      todayAppointments,
      pendingTriages,
      todayConsultations,
      monthlyAppointments,
      monthlyConsultations
    ] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Appointment.countDocuments({ 
        fecha: { $gte: today, $lt: tomorrow }
      }),
      Triage.countDocuments({ 
        estado: 'pendiente',
        fechaHora: { $gte: today, $lt: tomorrow }
      }),
      Consultation.countDocuments({ 
        fechaHora: { $gte: today, $lt: tomorrow }
      }),
      Appointment.countDocuments({ 
        fecha: { 
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
        }
      }),
      Consultation.countDocuments({ 
        fechaHora: { 
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
        }
      })
    ]);

    res.json({
      totalPatients,
      todayAppointments,
      pendingTriages,
      todayConsultations,
      monthlyAppointments,
      monthlyConsultations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get recent activities
router.get('/recent-activities', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentAppointments, recentTriages, recentConsultations] = await Promise.all([
      Appointment.find({ 
        fecha: { $gte: today }
      })
      .populate('pacienteId', 'nombre apellido')
      .populate('medicoId', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
      
      Triage.find({ 
        fechaHora: { $gte: today }
      })
      .populate('pacienteId', 'nombre apellido')
      .populate('enfermeraId', 'name')
      .sort({ fechaHora: -1 })
      .limit(5),
      
      Consultation.find({ 
        fechaHora: { $gte: today }
      })
      .populate('pacienteId', 'nombre apellido')
      .populate('medicoId', 'name')
      .sort({ fechaHora: -1 })
      .limit(5)
    ]);

    res.json({
      appointments: recentAppointments,
      triages: recentTriages,
      consultations: recentConsultations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;