const mongoose = require('mongoose');

const ConsultorioSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nombre: {
    type: String,
    required: true
  },
  ubicacion: {
    type: String,
    required: true
  },
  equipamiento: [{
    type: String
  }],
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Consultorio', ConsultorioSchema);
