import express from 'express';
import Triage from '../models/Triage';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get triages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado } = req.query;
    let filter: any = {};
    
    if (fecha) {
      const startDate = new Date(fecha as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fechaHora = { $gte: startDate, $lt: endDate };
    }
    
    if (estado) {
      filter.estado = estado;
    }

    const triages = await Triage.find(filter)
      .populate('pacienteId', 'nombre apellido cedula edad')
      .populate('enfermeraId', 'name')
      .sort({ fechaHora: -1 });
    
    res.json(triages);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create triage
router.post('/', authMiddleware, async (req, res) => {
  try {
    const triage = new Triage({
      ...req.body,
      enfermeraId: req.user.userId
    });
    await triage.save();
    
    const populatedTriage = await Triage.findById(triage._id)
      .populate('pacienteId', 'nombre apellido cedula')
      .populate('enfermeraId', 'name');
    
    res.status(201).json(populatedTriage);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update triage
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const triage = await Triage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('pacienteId', 'nombre apellido cedula')
     .populate('enfermeraId', 'name');
    
    if (!triage) {
      return res.status(404).json({ message: 'Triaje no encontrado' });
    }
    
    res.json(triage);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;