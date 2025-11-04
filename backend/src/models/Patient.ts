import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  cedula: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  telefono: string;
  email?: string;
  direccion: string;
  genero: 'M' | 'F';
  tipoSangre?: string;
  alergias?: string[];
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
  seguroMedico?: {
    compania: string;
    numeroPoliza: string;
  };
  isActive: boolean;
  createdAt: Date;
}

const PatientSchema: Schema = new Schema({
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

export default mongoose.model<IPatient>('Patient', PatientSchema);