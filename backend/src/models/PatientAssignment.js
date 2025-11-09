const mongoose = require('mongoose');

const PatientAssignmentSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  medicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asignadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motivoConsulta: {
    type: String,
    required: true
  },
  prioridad: {
    type: String,
    required: true,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  estado: {
    type: String,
    required: true,
    enum: ['asignado', 'en_consulta', 'completado', 'cancelado'],
    default: 'asignado'
  },
  observaciones: {
    type: String
  },
  triageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Triage'
  },
  fechaAsignacion: {
    type: Date,
    default: Date.now
  },
  fechaConsulta: {
    type: Date
  },
  fechaCompletado: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para mejorar las consultas
PatientAssignmentSchema.index({ medicoId: 1, estado: 1 });
PatientAssignmentSchema.index({ pacienteId: 1 });
PatientAssignmentSchema.index({ fechaAsignacion: -1 });
PatientAssignmentSchema.index({ estado: 1, fechaAsignacion: -1 });

module.exports = mongoose.model('PatientAssignment', PatientAssignmentSchema);