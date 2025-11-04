import mongoose, { Document, Schema } from 'mongoose';

export interface IConsultation extends Document {
  pacienteId: mongoose.Types.ObjectId;
  medicoId: mongoose.Types.ObjectId;
  citaId?: mongoose.Types.ObjectId;
  triageId?: mongoose.Types.ObjectId;
  motivoConsulta: string;
  anamnesis: string;
  examenFisico: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos?: {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }[];
  examenes?: {
    tipo: string;
    descripcion: string;
    urgente: boolean;
  }[];
  proximaCita?: Date;
  estado: 'en_curso' | 'completada';
  fechaHora: Date;
  createdAt: Date;
}

const ConsultationSchema: Schema = new Schema({
  pacienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  medicoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citaId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  triageId: {
    type: Schema.Types.ObjectId,
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

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);