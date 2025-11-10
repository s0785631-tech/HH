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
              nombre: 'María',
              apellido: 'González',
              cedula: '12345678',
              fechaNacimiento: '1985-05-15',
              telefono: '555-0123',
              genero: 'F',
              direccion: 'Calle 123 #45-67',
              email: 'maria.gonzalez@email.com'
            },
            medicoId: user.id,
            motivoConsulta: 'Dolor de cabeza persistente y mareos',
            prioridad: 'media',
            estado: 'asignado',
            fechaAsignacion: new Date().toISOString(),
            observaciones: 'Paciente refiere síntomas desde hace 3 días'
          },
          {
            _id: '2',
            pacienteId: {
              _id: '2',
              nombre: 'Carlos',
              apellido: 'Rodríguez',
              cedula: '87654321',
              fechaNacimiento: '1978-12-03',
              telefono: '555-0456',
              genero: 'M',
              direccion: 'Avenida 456 #78-90',
              email: 'carlos.rodriguez@email.com'
            },
            medicoId: user.id,
            motivoConsulta: 'Control de hipertensión arterial',
            prioridad: 'alta',
            estado: 'asignado',
            fechaAsignacion: new Date(Date.now() - 3600000).toISOString(),
            observaciones: 'Paciente hipertenso en tratamiento'
          }
        ];
        setAssignedPatients(mockAssignments);
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error);
      setAssignedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations?fecha=${today}&medicoId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setConsultations([]);
    }
  };

  const checkForNewAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patient-assignments/doctor/new`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const newAssignments = await response.json();
        if (newAssignments.length > 0) {
          newAssignments.forEach((assignment: PatientAssignment) => {
            addNotification({
              id: `assignment-${assignment._id}`,
              message: `Nuevo paciente asignado: ${assignment.pacienteId.nombre} ${assignment.pacienteId.apellido}`,
              type: 'assignment',
              timestamp: new Date(),
              read: false
            });
          });
          fetchAssignedPatients();
        }
      }
    } catch (error) {
      console.error('Error checking for new assignments:', error);
    }
  };

  const addNotification = (notification: NotificationAlert) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Mantener solo 10 notificaciones
    
    // Mostrar alerta flotante
    setSuccessMessage(notification.message);
    setShowSuccessToast(true);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleStartConsultation = (assignment: PatientAssignment) => {
    setSelectedPatient(assignment);
    setNewConsultation({
      ...newConsultation,
      pacienteId: assignment.pacienteId,
      motivoConsulta: assignment.motivoConsulta
    });
    setShowConsultationModal(true);
    
    // Actualizar estado de la asignación
    updateAssignmentStatus(assignment._id, 'en_consulta');
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patient-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newStatus })
      });
      
      // Actualizar estado local
      setAssignedPatients(prev => 
        prev.map(assignment => 
          assignment._id === assignmentId 
            ? { ...assignment, estado: newStatus as any }
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const consultationData = {
        ...newConsultation,
        estado: 'completada'
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });
      
      if (response.ok) {
        const savedConsultation = await response.json();
        
        // Marcar asignación como completada
        if (selectedPatient) {
          await updateAssignmentStatus(selectedPatient._id, 'completado');
        }
        
        fetchConsultations();
        fetchAssignedPatients();
        setShowConsultationModal(false);
        setSelectedPatient(null);
        setNewConsultation({
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
        
        setSuccessMessage('¡Consulta guardada exitosamente!');
        setShowSuccessToast(true);
        setActiveTab('consultas');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error al guardar la consulta');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'asignado': return 'bg-blue-100 text-blue-800';
      case 'en_consulta': return 'bg-orange-100 text-orange-800';
      case 'completado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayStats = {
    asignados: assignedPatients.filter(p => p.estado === 'asignado').length,
    enConsulta: assignedPatients.filter(p => p.estado === 'en_consulta').length,
    completados: assignedPatients.filter(p => p.estado === 'completado').length,
    consultas: consultations.length
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pacientes asignados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-900">Panel Médico</h1>
              <p className="text-blue-700">Dr. {doctorInfo.nombre} {doctorInfo.apellido} - {doctorInfo.especialidad}</p>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-1 rounded-full ${
                              notification.type === 'assignment' ? 'bg-green-100' :
                              notification.type === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {notification.type === 'assignment' ? (
                                <User className="w-4 h-4 text-green-600" />
                              ) : notification.type === 'urgent' ? (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              ) : (
                                <Bell className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp.toLocaleTimeString('es-ES')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes Asignados</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.asignados}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Consulta</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.enConsulta}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultas Hoy</p>
                <p className="text-2xl font-bold text-purple-600">{todayStats.consultas}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('asignados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'asignados'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pacientes Asignados ({assignedPatients.filter(p => p.estado !== 'completado').length})
              </button>
              <button
                onClick={() => setActiveTab('consultas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consultas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Consultas del Día
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'historial'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Historial
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'asignados' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pacientes Asignados</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {assignedPatients.filter(p => p.estado !== 'completado').length > 0 ? 
                assignedPatients.filter(p => p.estado !== 'completado').map((assignment) => (
                <div key={assignment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.pacienteId.nombre} {assignment.pacienteId.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(assignment.pacienteId.fechaNacimiento)} años)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(assignment.prioridad)}`}>
                          {assignment.prioridad.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(assignment.estado)}`}>
                          {assignment.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">C.I:</span> {assignment.pacienteId.cedula}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Teléfono:</span> {assignment.pacienteId.telefono}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Género:</span> {assignment.pacienteId.genero === 'M' ? 'Masculino' : 'Femenino'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {assignment.pacienteId.email || 'No registrado'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Dirección:</span> {assignment.pacienteId.direccion || 'No registrada'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Asignado:</span> {new Date(assignment.fechaAsignacion).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Motivo de Consulta:</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{assignment.motivoConsulta}</p>
                      </div>
                      
                      {assignment.observaciones && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Observaciones:</p>
                          <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{assignment.observaciones}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {assignment.estado === 'asignado' && (
                        <button
                          onClick={() => handleStartConsultation(assignment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Stethoscope className="w-4 h-4" />
                          <span>Iniciar Consulta</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedPatient(assignment);
                          // Aquí podrías abrir un modal con más detalles del paciente
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Detalles</span>
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes asignados</h3>
                  <p className="text-gray-600">Los pacientes asignados por recepción aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'consultas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Consultas del Día</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {consultations.length > 0 ? consultations.map((consultation) => (
                <div key={consultation._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.pacienteId.nombre} {consultation.pacienteId.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(consultation.pacienteId.fechaNacimiento)} años)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          consultation.estado === 'completada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {consultation.estado === 'completada' ? 'COMPLETADA' : 'EN CURSO'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{consultation.motivoConsulta}</p>
                      <p className="text-sm text-gray-600 mb-3">{consultation.diagnostico}</p>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(consultation.fechaHora).toLocaleString('es-ES')}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => PDFGenerator.generateConsultationPDF(consultation, doctorInfo).then(blob => {
                          const filename = `historia_clinica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
                          PDFGenerator.downloadPDF(blob, filename);
                        })}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Historia</span>
                      </button>
                      <button
                        onClick={() => PDFGenerator.generatePrescriptionPDF(consultation, doctorInfo).then(blob => {
                          const filename = `receta_medica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
                          PDFGenerator.downloadPDF(blob, filename);
                        })}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Receta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay consultas registradas</h3>
                  <p className="text-gray-600">Las consultas del día aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Historial de Consultas</h3>
                <p className="text-gray-600">Aquí aparecerá el historial completo de consultas realizadas</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {showConsultationModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Consulta</h2>
              <p className="text-gray-600">
                Paciente: {selectedPatient.pacienteId.nombre} {selectedPatient.pacienteId.apellido} - 
                C.I: {selectedPatient.pacienteId.cedula}
              </p>
            </div>
            
            <form onSubmit={handleSaveConsultation} className="p-6 space-y-6">
              {/* Información del Paciente */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Edad:</span>
                    <span className="ml-1 text-blue-700">{calculateAge(selectedPatient.pacienteId.fechaNacimiento)} años</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Género:</span>
                    <span className="ml-1 text-blue-700">{selectedPatient.pacienteId.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Teléfono:</span>
                    <span className="ml-1 text-blue-700">{selectedPatient.pacienteId.telefono}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Prioridad:</span>
                    <span className={`ml-1 font-medium ${
                      selectedPatient.prioridad === 'alta' ? 'text-red-700' :
                      selectedPatient.prioridad === 'media' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {selectedPatient.prioridad.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Motivo de Asignación:</span> {selectedPatient.motivoConsulta}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de Consulta *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.motivoConsulta}
                    onChange={(e) => setNewConsultation({...newConsultation, motivoConsulta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anamnesis *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.anamnesis}
                    onChange={(e) => setNewConsultation({...newConsultation, anamnesis: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Examen Físico *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.examenFisico}
                    onChange={(e) => setNewConsultation({...newConsultation, examenFisico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.diagnostico}
                    onChange={(e) => setNewConsultation({...newConsultation, diagnostico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tratamiento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newConsultation.tratamiento}
                  onChange={(e) => setNewConsultation({...newConsultation, tratamiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowConsultationModal(false);
                    setSelectedPatient(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="¡Ups, algo salió mal!"
        message={errorMessage}
        buttonText="Aceptar"
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={successMessage}
      />
    </div>
  );
};

export default DoctorDashboard;