const mongoose = require('mongoose');

const EspecialidadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  descripcion: {
    type: String,
    required: true
  },
  activa: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Especialidad', EspecialidadSchema);
