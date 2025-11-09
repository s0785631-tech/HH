const express = require('express');
const Consultation = require('../models/Consultation');
const Triage = require('../models/Triage');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get consultations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado, medicoId } = req.query;
    let filter = {};
    
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fechaHora = { $gte: startDate, $lt: endDate };
    }
    
    if (estado) {
      filter.estado = estado;
    }
    
    if (medicoId) {
      filter.medicoId = medicoId;
    }

    const consultations = await Consultation.find(filter)
      .populate('pacienteId', 'nombre apellido cedula')
      .populate('medicoId', 'name')
      .populate('triageId')
      .sort({ fechaHora: -1 });
    
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get pending triages for consultations
router.get('/pending-triages', authMiddleware, async (req, res) => {
  try {
    // Obtener triajes que están completados por enfermería pero no han sido usados en consultas
    const usedTriageIds = await Consultation.distinct('triageId');
    
    const triages = await Triage.find({ 
      estado: { $in: ['completado', 'pendiente'] }, // Incluir pendientes y completados
      _id: { $nin: usedTriageIds } // Excluir los ya usados en consultas
    })
    .populate('pacienteId', 'nombre apellido cedula fechaNacimiento')
    .sort({ fechaHora: -1 });
    
    res.json(triages);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create consultation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const consultation = new Consultation({
      ...req.body,
      medicoId: req.user.userId
    });
    await consultation.save();
    
    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate('pacienteId', 'nombre apellido cedula')
      .populate('medicoId', 'name')
      .populate('triageId');
    
    res.status(201).json(populatedConsultation);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update consultation
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('pacienteId', 'nombre apellido cedula')
     .populate('medicoId', 'name')
     .populate('triageId');
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }
    
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;