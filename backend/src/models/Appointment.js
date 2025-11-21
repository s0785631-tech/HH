const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  motivo: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'],
    default: 'programada'
  },
  notas: {
    type: String
  },
  copago: {
    type: Number,
    default: function() {
      // El copago se calculará basado en el tipo de afiliación del paciente
      return 0; // Se actualizará cuando se cree la cita
    }
  },
  pagoCopago: {
    type: Boolean,
    default: false
  },
  fechaPago: {
    type: Date
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    default: 'efectivo'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);