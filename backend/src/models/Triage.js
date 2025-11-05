const mongoose = require('mongoose');

const TriageSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  sintomas: {
    type: String,
    required: true
  },
  prioridad: {
    type: String,
    required: true,
    enum: ['alta', 'media', 'baja']
  },
  signosVitales: {
    presionArterial: {
      type: String,
      required: true
    },
    temperatura: {
      type: Number,
      required: true
    },
    pulso: {
      type: Number,
      required: true
    },
    saturacionOxigeno: {
      type: Number,
      required: true
    },
    frecuenciaRespiratoria: {
      type: Number
    }
  },
  estado: {
    type: String,
    required: true,
    enum: ['pendiente', 'en_proceso', 'completado'],
    default: 'pendiente'
  },
  observaciones: {
    type: String
  },
  enfermeraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaHora: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Triage', TriageSchema);