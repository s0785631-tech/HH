const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  especialidad: {
    type: String,
    required: true
  },
  numeroLicencia: {
    type: String,
    required: true,
    unique: true
  },
  telefono: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  consultorio: {
    numero: {
      type: String,
      required: true
    },
    nombre: {
      type: String,
      required: true
    }
  },
  horarios: [{
    dia: {
      type: String,
      required: true,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    },
    horaInicio: {
      type: String,
      required: true
    },
    horaFin: {
      type: String,
      required: true
    },
    activo: {
      type: Boolean,
      default: true
    }
  }],
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
DoctorSchema.index({ cedula: 1 });
DoctorSchema.index({ numeroLicencia: 1 });
DoctorSchema.index({ email: 1 });
DoctorSchema.index({ userId: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);