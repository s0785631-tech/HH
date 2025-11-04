import express from 'express';
import Patient from '../models/Patient';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all patients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get patient by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create patient
router.post('/', authMiddleware, async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe un paciente con esta cédula' });
    } else {
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
});

// Update patient
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Search patients
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const query = req.params.query;
    const patients = await Patient.find({
      isActive: true,
      $or: [
        { nombre: { $regex: query, $options: 'i' } },
        { apellido: { $regex: query, $options: 'i' } },
        { cedula: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;