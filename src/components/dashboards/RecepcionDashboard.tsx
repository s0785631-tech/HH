import React, { useState, useEffect } from 'react';
import { automation } from '../../services/automationService';
import { 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Stethoscope
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
  email?: string;
  direccion: string;
  genero: 'M' | 'F';
  tipoAfiliacion: 'contributivo' | 'subsidiado';
  eps?: string;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
}

interface Doctor {
  _id: string;
  userId: string;
  nombre: string;
  apellido: string;
  cedula: string;
  especialidad: string;
  numeroLicencia: string;
  telefono: string;
  email: string;
  consultorio: {
    numero: string;
    nombre: string;
  };
  horarios: {
    dia: string;
    horaInicio: string;
    horaFin: string;
    activo: boolean;
  }[];
  isActive: boolean;
}

interface Appointment {
  _id?: string;
  pacienteId: string | Patient;
  medicoId: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
  notas?: string;
  copago?: number;
  pagoCopago?: boolean;
}

const RecepcionDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pacientes' | 'citas' | 'nuevo-paciente' | 'nueva-cita'>('pacientes');
  
  // Estados para modales
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  // Estados para horarios de doctores
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [doctorSchedule, setDoctorSchedule] = useState<any>(null);

  // Estados para formularios
  const [newPatient, setNewPatient] = useState<Patient>({
    _id: '',
    nombre: '',
    apellido: '',
    cedula: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    genero: 'M',
    tipoAfiliacion: 'contributivo',
    eps: '',
    contactoEmergencia: {
      nombre: '',
      telefono: '',
      relacion: ''
    }
  });

  const [newAppointment, setNewAppointment] = useState<Appointment>({
    pacienteId: '',
    medicoId: '',
    fecha: '',
    hora: '',
    motivo: '',
    estado: 'programada',
    notas: '',
    copago: 0,
    pagoCopago: false
  });

  const api = useAPI();

  useEffect(() => {
    fetchData();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-paciente':
          setActiveTab('nuevo-paciente');
          break;
        case 'buscar-pacientes':
          setActiveTab('pacientes');
          break;
        case 'nueva-cita':
          setActiveTab('nueva-cita');
          break;
        case 'gestionar-citas':
          setActiveTab('citas');
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  useEffect(() => {
    // Filtrar pacientes
    const filtered = patients.filter(patient =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cedula.includes(searchTerm) ||
      patient.telefono.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  useEffect(() => {
    // Filtrar citas
    const filtered = appointments.filter(appointment => {
      const patient = typeof appointment.pacienteId === 'object' ? appointment.pacienteId : null;
      if (!patient) return false;
      
      return (
        patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cedula.includes(searchTerm) ||
        appointment.motivo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments]);

  // Efecto para cargar fechas disponibles cuando se selecciona un doctor
  useEffect(() => {
    if (selectedDoctorId) {
      loadAvailableDates();
    } else {
      setAvailableDates([]);
      setAvailableHours([]);
      setSelectedDate('');
    }
  }, [selectedDoctorId]);

  // Efecto para cargar horas disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadAvailableHours();
    } else {
      setAvailableHours([]);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsData, doctorsData, appointmentsData] = await Promise.all([
        api.patients.getAll(),
        api.doctors.getAll(),
        api.appointments.getAll()
      ]);
      
      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Error al cargar los datos');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = () => {
    const selectedDoctor = doctors.find(d => d._id === selectedDoctorId);
    if (!selectedDoctor) return;

    const dates: string[] = [];
    const today = new Date();
    
    // Generar fechas para los próximos 30 días
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = getDayName(date.getDay());
      const doctorSchedule = selectedDoctor.horarios.find(h => 
        h.dia === dayName && h.activo
      );
      
      // Solo agregar fechas donde el doctor tiene horario
      if (doctorSchedule) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    setAvailableDates(dates);
  };

  const loadAvailableHours = async () => {
    if (!selectedDoctorId || !selectedDate) return;

    try {
      // Obtener el horario del doctor para la fecha seleccionada
      const response = await api.doctors.getSchedule(selectedDoctorId, selectedDate);
      setDoctorSchedule(response);
      
      if (response.disponible) {
        const hours = generateTimeSlots(
          response.horario.horaInicio,
          response.horario.horaFin,
          response.horasOcupadas || []
        );
        setAvailableHours(hours);
      } else {
        setAvailableHours([]);
      }
    } catch (error) {
      console.error('Error loading doctor schedule:', error);
      // Fallback: generar horarios básicos si no hay respuesta del servidor
      const selectedDoctor = doctors.find(d => d._id === selectedDoctorId);
      if (selectedDoctor) {
        const date = new Date(selectedDate);
        const dayName = getDayName(date.getDay());
        const schedule = selectedDoctor.horarios.find(h => 
          h.dia === dayName && h.activo
        );
        
        if (schedule) {
          const hours = generateTimeSlots(schedule.horaInicio, schedule.horaFin, []);
          setAvailableHours(hours);
        }
      }
    }
  };

  const getDayName = (dayIndex: number): string => {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return days[dayIndex];
  };

  const generateTimeSlots = (startTime: string, endTime: string, occupiedHours: string[]): string[] => {
    const slots: string[] = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const current = new Date(start);
    
    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);
      
      // Solo agregar si no está ocupada
      if (!occupiedHours.includes(timeString)) {
        slots.push(timeString);
      }
      
      // Incrementar en intervalos de 30 minutos
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return slots;
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.patients.create(newPatient);
      
      fetchData();
      setNewPatient({
        _id: '',
        nombre: '',
        apellido: '',
        cedula: '',
        fechaNacimiento: '',
        telefono: '',
        email: '',
        direccion: '',
        genero: 'M',
        tipoAfiliacion: 'contributivo',
        eps: '',
        contactoEmergencia: {
          nombre: '',
          telefono: '',
          relacion: ''
        }
      });
      
      setSuccessMessage('¡Paciente creado exitosamente!');
      setShowSuccessToast(true);
      setActiveTab('pacientes');
    } catch (error) {
      setErrorMessage('Error al crear el paciente');
      setShowErrorModal(true);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctorId || !selectedDate || !newAppointment.hora) {
      setErrorMessage('Por favor seleccione doctor, fecha y hora');
      setShowErrorModal(true);
      return;
    }
    
    try {
      const appointmentData = {
        ...newAppointment,
        medicoId: selectedDoctorId,
        fecha: selectedDate
      };
      
      await api.appointments.create(appointmentData);
      
      fetchData();
      setNewAppointment({
        pacienteId: '',
        medicoId: '',
        fecha: '',
        hora: '',
        motivo: '',
        estado: 'programada',
        notas: '',
        copago: 0,
        pagoCopago: false
      });
      setSelectedDoctorId('');
      setSelectedDate('');
      setAvailableHours([]);
      setAvailableDates([]);
      
      setSuccessMessage('¡Cita creada exitosamente!');
      setShowSuccessToast(true);
      setActiveTab('citas');
      
      // Disparar evento de automatización
      automation.onPatientAssigned({
        pacienteId: appointmentData.pacienteId,
        medicoId: appointmentData.medicoId,
        motivoConsulta: appointmentData.motivo
      });
    } catch (error) {
      setErrorMessage('Error al crear la cita');
      setShowErrorModal(true);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) return;
    
    try {
      await api.patients.update(selectedPatient._id, selectedPatient);
      
      fetchData();
      setShowEditModal(false);
      setSelectedPatient(null);
      setSuccessMessage('¡Paciente actualizado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al actualizar el paciente');
      setShowErrorModal(true);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este paciente?')) return;
    
    try {
      await api.patients.delete(id);
      fetchData();
      setSuccessMessage('¡Paciente eliminado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar el paciente');
      setShowErrorModal(true);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta cita?')) return;
    
    try {
      await api.appointments.delete(id);
      fetchData();
      setSuccessMessage('¡Cita eliminada exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar la cita');
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'en_curso': return 'bg-yellow-100 text-yellow-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'no_asistio': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayStats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.fecha === today;
    }).length,
    pendingAppointments: appointments.filter(a => a.estado === 'programada').length,
    completedAppointments: appointments.filter(a => a.estado === 'completada').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-green-900">Dashboard de Recepción</h1>
              <p className="text-green-700">Gestión de pacientes y citas médicas</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar pacientes o citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-80"
              />
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
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalPatients}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.pendingAppointments}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completedAppointments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pacientes'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pacientes ({patients.length})
              </button>
              <button
                onClick={() => setActiveTab('citas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'citas'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Citas ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('nuevo-paciente')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nuevo-paciente'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nuevo Paciente
              </button>
              <button
                onClick={() => setActiveTab('nueva-cita')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nueva-cita'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nueva Cita
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'pacientes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Pacientes</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <div key={patient._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.nombre} {patient.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(patient.fechaNacimiento)} años)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          patient.tipoAfiliacion === 'contributivo' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {patient.tipoAfiliacion.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>C.I: {patient.cedula}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{patient.telefono}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{patient.email || 'No registrado'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{patient.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Dirección:</span> {patient.direccion}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Contacto de emergencia:</span> {patient.contactoEmergencia.nombre} 
                        ({patient.contactoEmergencia.relacion}) - {patient.contactoEmergencia.telefono}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPatient(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes registrados</h3>
                  <p className="text-gray-600">Los pacientes aparecerán aquí una vez registrados</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'citas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Citas</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredAppointments.length > 0 ? filteredAppointments.map((appointment) => {
                const patient = typeof appointment.pacienteId === 'object' ? appointment.pacienteId : null;
                const doctor = doctors.find(d => d.userId === appointment.medicoId);
                
                if (!patient) return null;
                
                return (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.nombre} {patient.apellido}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(appointment.estado)}`}>
                            {appointment.estado.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(appointment.fecha).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.hora}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="w-4 h-4" />
                            <span>Dr. {doctor?.nombre} {doctor?.apellido}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>C.I: {patient.cedula}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Motivo:</span> {appointment.motivo}
                        </p>
                        
                        {appointment.notas && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notas:</span> {appointment.notas}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteAppointment(appointment._id!)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar cita"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-12 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas programadas</h3>
                  <p className="text-gray-600">Las citas aparecerán aquí una vez programadas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nuevo-paciente' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Registrar Nuevo Paciente</h2>
            </div>
            
            <form onSubmit={handleCreatePatient} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatient.nombre}
                    onChange={(e) => setNewPatient({...newPatient, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatient.apellido}
                    onChange={(e) => setNewPatient({...newPatient, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatient.cedula}
                    onChange={(e) => setNewPatient({...newPatient, cedula: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPatient.fechaNacimiento}
                    onChange={(e) => setNewPatient({...newPatient, fechaNacimiento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPatient.telefono}
                    onChange={(e) => setNewPatient({...newPatient, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género *
                  </label>
                  <select
                    required
                    value={newPatient.genero}
                    onChange={(e) => setNewPatient({...newPatient, genero: e.target.value as 'M' | 'F'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Afiliación *
                  </label>
                  <select
                    required
                    value={newPatient.tipoAfiliacion}
                    onChange={(e) => setNewPatient({...newPatient, tipoAfiliacion: e.target.value as 'contributivo' | 'subsidiado'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="contributivo">Contributivo</option>
                    <option value="subsidiado">Subsidiado</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newPatient.direccion}
                  onChange={(e) => setNewPatient({...newPatient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.contactoEmergencia.nombre}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {...newPatient.contactoEmergencia, nombre: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatient.contactoEmergencia.telefono}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {...newPatient.contactoEmergencia, telefono: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relación *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.contactoEmergencia.relacion}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {...newPatient.contactoEmergencia, relacion: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: Madre, Esposo, Hermano"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Paciente</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'nueva-cita' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Programar Nueva Cita</h2>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    required
                    value={newAppointment.pacienteId}
                    onChange={(e) => setNewAppointment({...newAppointment, pacienteId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.nombre} {patient.apellido} - {patient.cedula}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor *
                  </label>
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar doctor</option>
                    {doctors.filter(d => d.isActive).map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.nombre} {doctor.apellido} - {doctor.especialidad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <select
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={!selectedDoctorId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDoctorId ? 'Seleccionar fecha' : 'Primero seleccione un doctor'}
                    </option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>
                  {selectedDoctorId && availableDates.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      El doctor seleccionado no tiene horarios disponibles
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <select
                    required
                    value={newAppointment.hora}
                    onChange={(e) => setNewAppointment({...newAppointment, hora: e.target.value})}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDate ? 'Seleccionar hora' : 'Primero seleccione una fecha'}
                    </option>
                    {availableHours.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  {selectedDate && availableHours.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No hay horarios disponibles para esta fecha
                    </p>
                  )}
                </div>
              </div>

              {/* Mostrar información del horario del doctor */}
              {doctorSchedule && doctorSchedule.disponible && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Información del Horario</h4>
                  <div className="text-sm text-blue-800">
                    <p>Horario de atención: {doctorSchedule.horario.horaInicio} - {doctorSchedule.horario.horaFin}</p>
                    {doctorSchedule.horasOcupadas && doctorSchedule.horasOcupadas.length > 0 && (
                      <p>Horas ocupadas: {doctorSchedule.horasOcupadas.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la Consulta *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newAppointment.motivo}
                  onChange={(e) => setNewAppointment({...newAppointment, motivo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describa el motivo de la consulta"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={newAppointment.notas}
                  onChange={(e) => setNewAppointment({...newAppointment, notas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedDoctorId || !selectedDate || !newAppointment.hora}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Programar Cita</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Paciente</h2>
            </div>
            
            <form onSubmit={handleUpdatePatient} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedPatient.nombre}
                    onChange={(e) => setSelectedPatient({...selectedPatient, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedPatient.apellido}
                    onChange={(e) => setSelectedPatient({...selectedPatient, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={selectedPatient.telefono}
                    onChange={(e) => setSelectedPatient({...selectedPatient, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedPatient.email || ''}
                    onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <textarea
                  required
                  rows={3}
                  value={selectedPatient.direccion}
                  onChange={(e) => setSelectedPatient({...selectedPatient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPatient(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Actualizar
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

export default RecepcionDashboard;