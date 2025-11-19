const express = require('express');
const Especialidad = require('../models/Especialidad');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const especialidades = await Especialidad.find().sort({ nombre: 1 });
    res.json(especialidades);
  } catch (error) {
    console.error('Error fetching especialidades:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const especialidad = await Especialidad.findById(req.params.id);
    if (!especialidad) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }
    res.json(especialidad);
  } catch (error) {
    console.error('Error fetching especialidad:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const especialidad = new Especialidad(req.body);
    await especialidad.save();
    res.status(201).json(especialidad);
  } catch (error) {
    console.error('Error creating especialidad:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ya existe una especialidad con este nombre' });
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

    const especialidad = await Especialidad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!especialidad) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    res.json(especialidad);
  } catch (error) {
    console.error('Error updating especialidad:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const especialidad = await Especialidad.findByIdAndDelete(req.params.id);

    if (!especialidad) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    res.json({ message: 'Especialidad eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting especialidad:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
