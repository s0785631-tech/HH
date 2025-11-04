import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  pacienteId: mongoose.Types.ObjectId;
  medicoId: mongoose.Types.ObjectId;
  fecha: Date;
  hora: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
  notas?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AppointmentSchema: Schema = new Schema({
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
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  motivo: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'],
    default: 'programada'
  },
  notas: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);