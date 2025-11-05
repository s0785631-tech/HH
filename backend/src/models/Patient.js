const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true
  },
  direccion: {
    type: String,
    required: true
  },
  genero: {
    type: String,
    required: true,
    enum: ['M', 'F']
  },
  tipoSangre: {
    type: String
  },
  alergias: [{
    type: String
  }],
  contactoEmergencia: {
    nombre: {
      type: String,
      required: true
    },
    telefono: {
      type: String,
      required: true
    },
    relacion: {
      type: String,
      required: true
    }
  },
  seguroMedico: {
    compania: String,
    numeroPoliza: String
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

module.exports = mongoose.model('Patient', PatientSchema);