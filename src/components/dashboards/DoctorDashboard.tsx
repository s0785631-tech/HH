import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  Calendar, 
  FileText, 
  Activity,
  User,
  Heart,
  Thermometer,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  Eye,
  Bell,
  X
} from 'lucide-react';
import { PDFGenerator } from '../../utils/pdfGenerator';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
  genero: 'M' | 'F';
  direccion?: string;
  email?: string;
}

interface PatientAssignment {
  _id: string;
  pacienteId: Patient;
  medicoId: string;
  motivoConsulta: string;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'asignado' | 'en_consulta' | 'completado';
  fechaAsignacion: string;
  triageId?: string;
  observaciones?: string;
}

interface Consultation {
  _id?: string;
  pacienteId: Patient;
  medicoId: any;
  motivoConsulta: string;
  anamnesis: string;
  examenFisico: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }[];
  examenes: {
    tipo: string;
    descripcion: string;
    urgente: boolean;
  }[];
  proximaCita?: string;
  estado: 'en_curso' | 'completada';
  fechaHora: string;
}

interface NotificationAlert {
  id: string;
  message: string;
  type: 'assignment' | 'urgent' | 'info';
  timestamp: Date;
  read: boolean;
}

const DoctorDashboard: React.FC = () => {
  const [assignedPatients, setAssignedPatients] = useState<PatientAssignment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientAssignment | null>(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'asignados' | 'consultas' | 'historial'>('asignados');
  
  // Estados para notificaciones
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newConsultation, setNewConsultation] = useState<Consultation>({
    pacienteId: {} as Patient,
    medicoId: '',
    motivoConsulta: '',
    anamnesis: '',
    examenFisico: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
    examenes: [{ tipo: '', descripcion: '', urgente: false }],
    proximaCita: '',
    estado: 'en_curso',
    fechaHora: new Date().toISOString()
  });

  // Información del doctor logueado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Obtener información del doctor desde el token o usar datos por defecto
  const doctorInfo = user.doctorInfo ? {
    nombre: user.doctorInfo.nombre,
    apellido: user.doctorInfo.apellido,
    especialidad: user.doctorInfo.especialidad,
    numeroLicencia: user.doctorInfo.numeroLicencia,
    consultorio: user.doctorInfo.consultorio || {
      numero: '101',
      nombre: 'Consultorio Principal'
    },
    cedula: user.doctorInfo.cedula,
    telefono: user.doctorInfo.telefono,
    email: user.doctorInfo.email
  } : {
    nombre: user.name?.split(' ')[1] || 'Doctor',
    apellido: user.name?.split(' ')[2] || '',
    especialidad: 'Medicina General',
    numeroLicencia: 'MED-12345',
    consultorio: {
      numero: '101',
      nombre: 'Consultorio Principal'
    },
    cedula: 'N/A',
    telefono: 'N/A',
    email: 'N/A'
  };

  useEffect(() => {
    fetchAssignedPatients();
    fetchConsultations();
    
    // Simular notificaciones en tiempo real
    const notificationInterval = setInterval(() => {
      checkForNewAssignments();
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(notificationInterval);
  }, []);

  const fetchAssignedPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patient-assignments/doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignedPatients(data);
      } else {
        // Datos simulados para demostración
        const mockAssignments: PatientAssignment[] = [
          {
            _id: '1',
            pacienteId: {
              _id: '1',
              nombre: '