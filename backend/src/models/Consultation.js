const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
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
  citaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  triageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Triage'
  },
  motivoConsulta: {
    type: String,
    required: true
  },
  anamnesis: {
    type: String,
    required: true
  },
  examenFisico: {
    type: String,
    required: true
  },
  diagnostico: {
    type: String,
    required: true
  },
  tratamiento: {
    type: String,
    required: true
  },
  medicamentos: [{
    nombre: {
      type: String,
      required: true
    },
    dosis: {
      type: String,
      required: true
    },
    frecuencia: {
      type: String,
      required: true
    },
    duracion: {
      type: String,
      required: true
    }
  }],
  examenes: [{
    tipo: {
      type: String,
      required: true
    },
    descripcion: {
      type: String,
      required: true
    },
    urgente: {
      type: Boolean,
      default: false
    }
  }],
  proximaCita: {
    type: Date
  },
  estado: {
    type: String,
    required: true,
    enum: ['en_curso', 'completada'],
    default: 'en_curso'
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

module.exports = mongoose.model('Consultation', ConsultationSchema);