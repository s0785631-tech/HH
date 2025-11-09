const express = require('express');
const PatientAssignment = require('../models/PatientAssignment');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get assignments for a specific doctor
router.get('/doctor', authMiddleware, async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    let filter = { 
      medicoId: req.user.userId,
      isActive: true 
    };
    
    if (estado) {
      filter.estado = estado;
    }
    
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fechaAsignacion = { $gte: startDate, $lt: endDate };
    }

    const assignments = await PatientAssignment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula fechaNacimiento telefono genero direccion email')
      .populate('medicoId', 'name email')
      .populate('asignadoPor', 'name')
      .populate('triageId')
      .sort({ fechaAsignacion: -1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching doctor assignments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get new assignments for a doctor (for notifications)
router.get('/doctor/new', authMiddleware, async (req, res) => {
  try {
    const lastCheck = req.query.lastCheck || new Date(Date.now() - 5 * 60 * 1000); // Últimos 5 minutos por defecto
    
    const newAssignments = await PatientAssignment.find({
      medicoId: req.user.userId,
      estado: 'asignado',
      fechaAsignacion: { $gte: new Date(lastCheck) },
      isActive: true
    })
    .populate('pacienteId', 'nombre apellido cedula')
    .sort({ fechaAsignacion: -1 });
    
    res.json(newAssignments);
  } catch (error) {
    console.error('Error fetching new assignments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get all assignments (for reception/admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { medicoId, estado, fecha } = req.query;
    let filter = { isActive: true };
    
    if (medicoId) {
      filter.medicoId = medicoId;
    }
    
    if (estado) {
      filter.estado = estado;
    }
    
    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.fechaAsignacion = { $gte: startDate, $lt: endDate };
    }

    const assignments = await PatientAssignment.find(filter)
      .populate('pacienteId', 'nombre apellido cedula fechaNacimiento telefono genero')
      .populate('medicoId', 'name email')
      .populate('asignadoPor', 'name')
      .sort({ fechaAsignacion: -1 });
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create new assignment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const assignment = new PatientAssignment({
      ...req.body,
      asignadoPor: req.user.userId
    });
    
    await assignment.save();
    
    const populatedAssignment = await PatientAssignment.findById(assignment._id)
      .populate('pacienteId', 'nombre apellido cedula fechaNacimiento telefono genero')
      .populate('medicoId', 'name email')
      .populate('asignadoPor', 'name');
    
    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update assignment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Actualizar fechas según el estado
    if (updateData.estado === 'en_consulta' && !updateData.fechaConsulta) {
      updateData.fechaConsulta = new Date();
    } else if (updateData.estado === 'completado' && !updateData.fechaCompletado) {
      updateData.fechaCompletado = new Date();
    }
    
    const assignment = await PatientAssignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('pacienteId', 'nombre apellido cedula fechaNacimiento telefono genero')
    .populate('medicoId', 'name email')
    .populate('asignadoPor', 'name');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Delete assignment (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await PatientAssignment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }
    
    res.json({ message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get assignment statistics
router.get('/stats/doctor', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAsignados,
      asignadosHoy,
      enConsulta,
      completadosHoy,
      pendientes
    ] = await Promise.all([
      PatientAssignment.countDocuments({ 
        medicoId: req.user.userId,
        isActive: true 
      }),
      PatientAssignment.countDocuments({ 
        medicoId: req.user.userId,
        fechaAsignacion: { $gte: today, $lt: tomorrow },
        isActive: true 
      }),
      PatientAssignment.countDocuments({ 
        medicoId: req.user.userId,
        estado: 'en_consulta',
        isActive: true 
      }),
      PatientAssignment.countDocuments({ 
        medicoId: req.user.userId,
        estado: 'completado',
        fechaCompletado: { $gte: today, $lt: tomorrow },
        isActive: true 
      }),
      PatientAssignment.countDocuments({ 
        medicoId: req.user.userId,
        estado: 'asignado',
        isActive: true 
      })
    ]);

    res.json({
      totalAsignados,
      asignadosHoy,
      enConsulta,
      completadosHoy,
      pendientes
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;