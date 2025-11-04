import mongoose, { Document, Schema } from 'mongoose';

export interface ITriage extends Document {
  pacienteId: mongoose.Types.ObjectId;
  sintomas: string;
  prioridad: 'alta' | 'media' | 'baja';
  signosVitales: {
    presionArterial: string;
    temperatura: number;
    pulso: number;
    saturacionOxigeno: number;
    frecuenciaRespiratoria?: number;
  };
  estado: 'pendiente' | 'en_proceso' | 'completado';
  observaciones?: string;
  enfermeraId: mongoose.Types.ObjectId;
  fechaHora: Date;
  createdAt: Date;
}

const TriageSchema: Schema = new Schema({
  pacienteId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
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

export default mongoose.model<ITriage>('Triage', TriageSchema);