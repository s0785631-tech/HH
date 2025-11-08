const mongoose = require('mongoose');

const ConsultationDocumentSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true
  },
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
  documentType: {
    type: String,
    required: true,
    enum: ['historia_clinica', 'receta_medica', 'orden_examenes', 'certificado_medico']
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    default: 'application/pdf'
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      default: '1.0'
    },
    template: {
      type: String,
      default: 'saviser_standard'
    }
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
ConsultationDocumentSchema.index({ consultationId: 1 });
ConsultationDocumentSchema.index({ pacienteId: 1 });
ConsultationDocumentSchema.index({ medicoId: 1 });
ConsultationDocumentSchema.index({ documentType: 1 });
ConsultationDocumentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ConsultationDocument', ConsultationDocumentSchema);