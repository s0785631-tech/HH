const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ConsultationDocument = require('../models/ConsultationDocument');
const Consultation = require('../models/Consultation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/consultation-documents');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// Subir documento de consulta
router.post('/upload', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const { consultationId, documentType } = req.body;

    if (!consultationId || !documentType) {
      return res.status(400).json({ message: 'consultationId y documentType son requeridos' });
    }

    // Verificar que la consulta existe
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    // Crear registro del documento
    const document = new ConsultationDocument({
      consultationId,
      pacienteId: consultation.pacienteId,
      medicoId: consultation.medicoId,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await document.save();

    res.status(201).json({
      message: 'Documento guardado exitosamente',
      document: {
        id: document._id,
        fileName: document.fileName,
        documentType: document.documentType,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener documentos de una consulta
router.get('/consultation/:consultationId', authMiddleware, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const documents = await ConsultationDocument.find({
      consultationId,
      isActive: true
    })
    .populate('pacienteId', 'nombre apellido cedula')
    .populate('medicoId', 'name')
    .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching consultation documents:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener documentos de un paciente
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { documentType } = req.query;

    let filter = {
      pacienteId: patientId,
      isActive: true
    };

    if (documentType) {
      filter.documentType = documentType;
    }

    const documents = await ConsultationDocument.find(filter)
    .populate('consultationId')
    .populate('medicoId', 'name')
    .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Descargar documento
router.get('/download/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await ConsultationDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado en el sistema' });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);

    // Enviar archivo
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar documento (soft delete)
router.delete('/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await ConsultationDocument.findByIdAndUpdate(
      documentId,
      { isActive: false },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;