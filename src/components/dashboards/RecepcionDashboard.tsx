import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Phone, UserPlus, Search, CheckCircle, XCircle, AlertCircle, CreditCard as Edit, Eye, Plus, User } from 'lucide-react';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email?: string;
  appointmentHistory?: {
    proximaCita?: {
      fecha: string;
      hora: string;
  X,
  Stethoscope,
  User
      estado: string;
    };
    ultimaAsistencia?: {
      fecha: string;
      estado: string;
    };
    totalCitas: number;
    citasCompletadas: number;
    citasCanceladas: number;
    citasNoAsistio: number;
  };
}

interface Appointment {
  _id: string;
  pacienteId: Patient;
  medicoId: { 
    _id: string;
    name: string; 
  };
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
}

interface Doctor {
  _id: string;
interface Doctor {
  _id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  consultorio: {
    numero: string;
    nombre: string;
  };
  isActive: boolean;
}

interface PatientAssignment {
  _id?: string;
  pacienteId: string;
  medicoId: string;
  motivoConsulta: string;
  prioridad: 'alta' | 'media' | 'baja';
  observaciones?: string;
}

  nombre: string;
  apellido: string;
  especialidad: string;
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
}

const RecepcionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'pacientes' | 'citas' | 'nueva-cita' | 'asignar-paciente'>('pacientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'citas' | 'pacientes' | 'buscar'>('citas');
  const [showAssignPatientModal, setShowAssignPatientModal] = useState(false);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda de paciente en nueva cita
  const [searchCedulaCita, setSearchCedulaCita] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  const [newAppointment, setNewAppointment] = useState({
    pacienteId: '',
    medicoId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    motivo: ''
  });

  const [newPatient, setNewPatient] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    genero: 'M' as 'M' | 'F',
    contactoEmergencia: {
  const [newAssignment, setNewAssignment] = useState<PatientAssignment>({
    pacienteId: '',
    medicoId: '',
    motivoConsulta: '',
    prioridad: 'media',
    observaciones: ''
  });

      nombre: '',
      telefono: '',
      relacion: ''
    }
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
    fetchDoctors();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-paciente':
          setShowNewPatient(true);
          break;
        case 'buscar-pacientes':
          setActiveTab('buscar');
          break;
        case 'nueva-cita':
          handleOpenNewAppointment();
          break;
        case 'gestionar-citas':
          setActiveTab('citas');
          break;
        case 'asignar-paciente':
          setActiveTab('asignar-paciente');
          setShowAssignPatientModal(true);
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, [selectedDate]);

  useEffect(() => {
    if (newAppointment.medicoId && newAppointment.fecha) {
      fetchAvailableHours();
    }
  }, [newAppointment.medicoId, newAppointment.fecha]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments?fecha=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchAvailableHours = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors/${newAppointment.medicoId}/horarios/${newAppointment.fecha}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.disponible) {
          const hours = generateAvailableHours(data.horario.horaInicio, data.horario.horaFin, data.horasOcupadas);
          setAvailableHours(hours);
        } else {
          setAvailableHours([]);
        }
      } else {
        setAvailableHours([]);
      }
    } catch (error) {
      console.error('Error fetching available hours:', error);
      setAvailableHours([]);
    }
  };

  const generateAvailableHours = (startTime: string, endTime: string, occupiedHours: string[]) => {
    const hours = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (start < end) {
      const timeString = start.toTimeString().slice(0, 5);
      if (!occupiedHours.includes(timeString)) {
        hours.push(timeString);
      }
      start.setMinutes(start.getMinutes() + 30); // Citas cada 30 minutos
    }
    
    return hours;
  };

  const searchPatientByCedula = async () => {
    if (!searchCedulaCita.trim()) {
      setErrorMessage('Por favor ingrese un número de identificación');
      setShowErrorModal(true);
      return;
    }

    setSearchingPatient(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patients/search/${searchCedulaCita}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const patient = data[0];
          setFoundPatient(patient);
          setNewAppointment({...newAppointment, pacienteId: patient._id});

          // Buscar historial de citas del paciente
          await fetchPatientAppointmentHistory(patient._id);
        } else {
          setFoundPatient(null);
          setNewAppointment({...newAppointment, pacienteId: ''});
          setPatientAppointments([]);
          setErrorMessage('No se encontró ningún paciente con ese número de identificación');
          setShowErrorModal(true);
        }
      } else {
        setFoundPatient(null);
        setNewAppointment({...newAppointment, pacienteId: ''});
        setPatientAppointments([]);
        setErrorMessage('Error al buscar el paciente. Intente nuevamente.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setFoundPatient(null);
      setNewAppointment({...newAppointment, pacienteId: ''});
      setPatientAppointments([]);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    } finally {
      setSearchingPatient(false);
    }
  };

  const fetchPatientAppointmentHistory = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments?pacienteId=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientAppointments(data);
      } else {
        setPatientAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching patient appointment history:', error);
      setPatientAppointments([]);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'en_curso': return 'bg-yellow-100 text-yellow-800';
      case 'completada': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'no_asistio': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'confirmada': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <XCircle className="w-4 h-4" />;
      case 'no_asistio': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newStatus })
      });
      
      if (response.ok) {
        fetchAppointments();
      } else {
        console.error('Error updating appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foundPatient) {
      setErrorMessage('Debe buscar y seleccionar un paciente válido antes de crear la cita');
      setShowErrorModal(true);
      return;
    }

    // Validar que la fecha no sea pasada
    const selectedDateTime = new Date(`${newAppointment.fecha}T${newAppointment.hora}`);
    const now = new Date();

    if (selectedDateTime < now) {
      setErrorMessage('No se pueden agendar citas en fechas u horas pasadas');
      setShowErrorModal(true);
      return;
    }

    // Validar que la hora esté dentro del horario del médico
    const selectedDoctor = doctors.find(d => d._id === newAppointment.medicoId);
    if (selectedDoctor) {
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const fechaObj = new Date(newAppointment.fecha);
      const diaSemana = diasSemana[fechaObj.getDay()];

      const horarioDelDia = selectedDoctor.horarios.find(h => h.dia === diaSemana && h.activo);

      if (!horarioDelDia) {
        setErrorMessage('El doctor no tiene horario disponible para el día seleccionado');
        setShowErrorModal(true);
        return;
      }

      // Validar que la hora esté dentro del rango
      const horaSeleccionada = newAppointment.hora;
      if (horaSeleccionada < horarioDelDia.horaInicio || horaSeleccionada >= horarioDelDia.horaFin) {
        setErrorMessage(`La hora seleccionada debe estar entre ${horarioDelDia.horaInicio} y ${horarioDelDia.horaFin}`);
        setShowErrorModal(true);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const appointmentData = {
        ...newAppointment,
        medicoId: newAppointment.medicoId
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        await fetchAppointments();
        setShowNewAppointment(false);
        setFoundPatient(null);
        setSearchCedulaCita('');
        setPatientAppointments([]);
        setNewAppointment({
          pacienteId: '',
          medicoId: '',
          fecha: new Date().toISOString().split('T')[0],
          hora: '',
          motivo: ''
        });
        setAvailableHours([]);

        setSuccessMessage('¡Cita creada exitosamente!');
        setShowSuccessToast(true);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error al crear la cita. Intente nuevamente.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPatient)
      });
      
      if (response.ok) {
        fetchPatients();
        setShowNewPatient(false);
        setNewPatient({
          cedula: '',
          nombre: '',
          apellido: '',
          fechaNacimiento: '',
          telefono: '',
          email: '',
          direccion: '',
          genero: 'M',
          contactoEmergencia: {
            nombre: '',
            telefono: '',
            relacion: ''
          }
        });
        
        // Mostrar notificación de éxito
        setSuccessMessage('¡Paciente registrado exitosamente!');
        setShowSuccessToast(true);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error al crear el paciente');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    }
  };

  const handleOpenNewAppointment = () => {
    setShowNewAppointment(true);
    setFoundPatient(null);
    setSearchCedulaCita('');
    setPatientAppointments([]);
    setNewAppointment({
      pacienteId: '',
      medicoId: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      motivo: ''
    });
    setAvailableHours([]);
  };

  const getPatientAppointmentSummary = (appointments: Appointment[]) => {
    const now = new Date();
    const futureCitas = appointments
      .filter(a => new Date(`${a.fecha}T${a.hora}`) > now && (a.estado === 'programada' || a.estado === 'confirmada'))
      .sort((a, b) => new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime());

    const pastCitas = appointments
      .filter(a => new Date(`${a.fecha}T${a.hora}`) <= now)
      .sort((a, b) => new Date(`${b.fecha}T${b.hora}`).getTime() - new Date(`${a.fecha}T${a.hora}`).getTime());

    return {
      proximaCita: futureCitas[0],
      ultimaAsistencia: pastCitas.find(c => c.estado === 'completada'),
      totalCitas: appointments.length,
      citasCompletadas: appointments.filter(a => a.estado === 'completada').length,
      citasCanceladas: appointments.filter(a => a.estado === 'cancelada').length,
      citasNoAsistio: appointments.filter(a => a.estado === 'no_asistio').length
    };
  };

  const formatDateTime = (fecha: string, hora: string) => {
    const date = new Date(`${fecha}T${hora}`);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPatients = patients.filter(patient =>
    patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cedula.includes(searchTerm)
  );

  const todayStats = {
    total: appointments.length,
    confirmadas: appointments.filter(a => a.estado === 'confirmada').length,
    pendientes: appointments.filter(a => a.estado === 'programada').length,
    completadas: appointments.filter(a => a.estado === 'completada').length
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-green-900">Recepción</h1>
              <p className="text-sm text-green-700">Gestión de citas y pacientes</p>
            </div>
            {/* <div className="flex space-x-3">
              <button
                onClick={() => setShowNewPatient(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Paciente</span>
              </button>
              <button
                onClick={handleOpenNewAppointment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cita</span>
              </button>
            </div> */}
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Citas Hoy</p>
                <p className="text-lg font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Confirmadas</p>
                <p className="text-lg font-bold text-green-600">{todayStats.confirmadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pendientes</p>
                <p className="text-lg font-bold text-orange-600">{todayStats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completadas</p>
                <p className="text-lg font-bold text-gray-600">{todayStats.completadas}</p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('citas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'citas'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Citas
                </button>
                <button
                  onClick={() => setActiveTab('pacientes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pacientes'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Pacientes
                </button>
                <button
                  onClick={() => setActiveTab('buscar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'buscar'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Buscar Pacientes
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'citas' && (
            <>
              {/* Appointments List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Citas del Día</h2>
                    <div className="flex items-center space-x-3">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleOpenNewAppointment}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Cita</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {appointments.length > 0 ? appointments.map((appointment) => (
                    <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.pacienteId.nombre} {appointment.pacienteId.apellido}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(appointment.estado)}`}>
                              {getStatusIcon(appointment.estado)}
                              <span>{appointment.estado.toUpperCase()}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.hora}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{appointment.pacienteId.telefono}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{appointment.motivo}</p>
                          <p className="text-sm text-gray-500">{appointment.medicoId.name}</p>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {appointment.estado === 'programada' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, 'confirmada')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                            >
                              Confirmar
                            </button>
                          )}
                          {(appointment.estado === 'programada' || appointment.estado === 'confirmada') && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, 'cancelada')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay citas programadas para esta fecha</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <button
                    onClick={handleOpenNewAppointment}
                    className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-blue-900">Nueva Cita</h3>
                        <p className="text-sm text-blue-700">Programar una nueva cita médica</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowNewPatient(true)}
                    className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <UserPlus className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-green-900">Nuevo Paciente</h3>
                        <p className="text-sm text-green-700">Registrar un nuevo paciente</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('buscar')}
                    className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Search className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-purple-900">Buscar Paciente</h3>
                        <p className="text-sm text-purple-700">Encontrar paciente registrado</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'pacientes' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Gestión de Pacientes</h2>
                    <button
                      onClick={() => setShowNewPatient(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Nuevo Paciente</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {patients.map((patient) => (
                      <div key={patient._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {patient.nombre} {patient.apellido}
                              </h3>
                              <p className="text-sm text-gray-600">C.I: {patient.cedula}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{patient.telefono}</span>
                          </div>
                          {patient.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>📧</span>
                              <span>{patient.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                            Ver Historial
                          </button>
                          <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm">
                            Nueva Cita
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buscar' && (
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Buscar Pacientes</h2>
              </div>
              
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                    <div key={patient._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {patient.nombre} {patient.apellido}
                            </h4>
                            <p className="text-sm text-gray-600">C.I: {patient.cedula}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{patient.telefono}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📧</span>
                            <span>{patient.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center justify-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>
                        <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center justify-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Cita</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center text-gray-500 py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pacientes</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Ingresa un término de búsqueda'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Cita</h2>
              <p className="text-sm text-gray-600">Primero busque el paciente por su número de identificación</p>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              {/* Búsqueda de paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Identificación del Paciente
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchCedulaCita}
                    onChange={(e) => setSearchCedulaCita(e.target.value)}
                    placeholder="Ingrese cédula o documento"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchPatientByCedula())}
                  />
                  <button
                    type="button"
                    onClick={searchPatientByCedula}
                    disabled={searchingPatient}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{searchingPatient ? 'Buscando...' : 'Buscar'}</span>
                  </button>
                </div>
              </div>

              {/* Información del paciente encontrado */}
              {foundPatient && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Paciente encontrado</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium">{foundPatient.nombre} {foundPatient.apellido}</p>
                      <p>C.I: {foundPatient.cedula}</p>
                      <p>Teléfono: {foundPatient.telefono}</p>
                    </div>
                  </div>

                  {/* Historial de citas del paciente */}
                  {patientAppointments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Historial de Citas</span>
                      </div>

                      {(() => {
                        const summary = getPatientAppointmentSummary(patientAppointments);
                        return (
                          <div className="space-y-2">
                            {summary.proximaCita && (
                              <div className="bg-white rounded p-2 border border-blue-300">
                                <p className="text-xs font-medium text-blue-800 mb-1">Próxima cita programada</p>
                                <p className="text-xs text-blue-700">
                                  {formatDateTime(summary.proximaCita.fecha, summary.proximaCita.hora)}
                                </p>
                                <p className="text-xs text-blue-600">Dr. {summary.proximaCita.medicoId.name}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getStatusColor(summary.proximaCita.estado)}`}>
                                  {summary.proximaCita.estado.toUpperCase()}
                                </span>
                              </div>
                            )}

                            {summary.ultimaAsistencia && (
                              <div className="bg-white rounded p-2 border border-blue-300">
                                <p className="text-xs font-medium text-blue-800 mb-1">Última asistencia</p>
                                <p className="text-xs text-blue-700">
                                  {formatDateTime(summary.ultimaAsistencia.fecha, summary.ultimaAsistencia.hora)}
                                </p>
                                <span className="text-xs text-green-600">Completada</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-white rounded p-2 text-center">
                                <p className="text-lg font-bold text-green-600">{summary.citasCompletadas}</p>
                                <p className="text-xs text-gray-600">Completadas</p>
                              </div>
                              <div className="bg-white rounded p-2 text-center">
                                <p className="text-lg font-bold text-orange-600">{summary.citasNoAsistio}</p>
                                <p className="text-xs text-gray-600">No asistió</p>
                              </div>
                            </div>

                            <p className="text-xs text-blue-600 mt-2">
                              Total de citas: {summary.totalCitas}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {patientAppointments.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600 text-center">Este paciente no tiene historial de citas</p>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                <select
                  required
                  value={newAppointment.medicoId}
                  onChange={(e) => setNewAppointment({...newAppointment, medicoId: e.target.value, hora: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.nombre} {doctor.apellido} - {doctor.especialidad} (Consultorio {doctor.consultorio.numero})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newAppointment.fecha}
                    onChange={(e) => setNewAppointment({...newAppointment, fecha: e.target.value, hora: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <select
                    required
                    value={newAppointment.hora}
                    onChange={(e) => setNewAppointment({...newAppointment, hora: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!newAppointment.medicoId || availableHours.length === 0}
                  >
                    <option value="">
                      {!newAppointment.medicoId ? 'Seleccione un doctor primero' : 
                       availableHours.length === 0 ? 'No hay horarios disponibles' : 
                       'Seleccionar hora'}
                    </option>
                    {availableHours.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {newAppointment.medicoId && availableHours.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    El doctor seleccionado no tiene horarios disponibles para esta fecha.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
                <textarea
                  required
                  rows={3}
                  value={newAppointment.motivo}
                  onChange={(e) => setNewAppointment({...newAppointment, motivo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!foundPatient || !newAppointment.medicoId || !newAppointment.hora}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      {showNewPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
            </div>
            
            <form onSubmit={handleCreatePatient} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
                  <input
                    type="text"
                    required
                    value={newPatient.cedula}
                    onChange={(e) => setNewPatient({...newPatient, cedula: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                  <select
                    required
                    value={newPatient.genero}
                    onChange={(e) => setNewPatient({...newPatient, genero: e.target.value as 'M' | 'F'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newPatient.nombre}
                    onChange={(e) => setNewPatient({...newPatient, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <input
                    type="text"
                    required
                    value={newPatient.apellido}
                    onChange={(e) => setNewPatient({...newPatient, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={newPatient.fechaNacimiento}
                    onChange={(e) => setNewPatient({...newPatient, fechaNacimiento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={newPatient.telefono}
                    onChange={(e) => setNewPatient({...newPatient, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  required
                  rows={2}
                  value={newPatient.direccion}
                  onChange={(e) => setNewPatient({...newPatient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      required
                      value={newPatient.contactoEmergencia.nombre}
                      onChange={(e) => setNewPatient({
                        ...newPatient, 
                        contactoEmergencia: {...newPatient.contactoEmergencia, nombre: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={newPatient.contactoEmergencia.telefono}
                      onChange={(e) => setNewPatient({
                        ...newPatient, 
                        contactoEmergencia: {...newPatient.contactoEmergencia, telefono: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación</label>
                    <input
                      type="text"
                      required
                      value={newPatient.contactoEmergencia.relacion}
                      onChange={(e) => setNewPatient({
                        ...newPatient, 
                        contactoEmergencia: {...newPatient.contactoEmergencia, relacion: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPatient(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crear Paciente
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