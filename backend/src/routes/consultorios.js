const express = require('express');
const Consultorio = require('../models/Consultorio');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const consultorios = await Consultorio.find().sort({ numero: 1 });
    res.json(consultorios);
  } catch (error) {
    console.error('Error fetching consultorios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const consultorio = await Consultorio.findById(req.params.id);
    if (!consultorio) {
      return res.status(404).json({ message: 'Consultorio no encontrado' });
    }
    res.json(consultorio);
  } catch (error) {
    console.error('Error fetching consultorio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const consultorio = new Consultorio(req.body);
    await consultorio.save();
    res.status(201).json(consultorio);
  } catch (error) {
    console.error('Error creating consultorio:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe un consultorio con este número' });
    } else {
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const consultorio = await Consultorio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!consultorio) {
      return res.status(404).json({ message: 'Consultorio no encontrado' });
    }

    res.json(consultorio);
  } catch (error) {
    console.error('Error updating consultorio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const consultorio = await Consultorio.findByIdAndDelete(req.params.id);

    if (!consultorio) {
      return res.status(404).json({ message: 'Consultorio no encontrado' });
    }

    res.json({ message: 'Consultorio eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting consultorio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
