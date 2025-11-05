import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Phone, UserPlus, Search, CheckCircle, XCircle, AlertCircle, CreditCard as Edit, Eye, Plus } from 'lucide-react';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email?: string;
}

interface Appointment {
  _id: string;
  pacienteId: Patient;
  medicoId: { name: string };
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
}

const RecepcionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda de paciente en nueva cita
  const [searchCedulaCita, setSearchCedulaCita] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

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
      nombre: '',
      telefono: '',
      relacion: ''
    }
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments?fecha=${selectedDate}`, {
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

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patients`, {
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

  const searchPatientByCedula = async () => {
    if (!searchCedulaCita.trim()) {
      setErrorMessage('Por favor ingrese un número de identificación');
      setShowErrorModal(true);
      return;
    }

    setSearchingPatient(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patients/search/${searchCedulaCita}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setFoundPatient(data[0]);
          setNewAppointment({...newAppointment, pacienteId: data[0]._id});
        } else {
          setFoundPatient(null);
          setNewAppointment({...newAppointment, pacienteId: ''});
          setErrorMessage('No se encontró ningún paciente con ese número de identificación');
          setShowErrorModal(true);
        }
      } else {
        setFoundPatient(null);
        setNewAppointment({...newAppointment, pacienteId: ''});
        setErrorMessage('Error al buscar el paciente. Intente nuevamente.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setFoundPatient(null);
      setNewAppointment({...newAppointment, pacienteId: ''});
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    } finally {
      setSearchingPatient(false);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
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

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAppointment)
      });
      
      if (response.ok) {
        fetchAppointments();
        setShowNewAppointment(false);
        setFoundPatient(null);
        setSearchCedulaCita('');
        setNewAppointment({
          pacienteId: '',
          medicoId: '',
          fecha: new Date().toISOString().split('T')[0],
          hora: '',
          motivo: ''
        });
        
        // Mostrar notificación de éxito
        setSuccessMessage('¡Cita creada exitosamente!');
        setShowSuccessToast(true);
      } else {
        setErrorMessage('Error al crear la cita. Intente nuevamente.');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patients`, {
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
    setNewAppointment({
      pacienteId: '',
      medicoId: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '',
      motivo: ''
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/SAVISER copy.png" 
                alt="SAVISER - Salud con calidad al servicio de todos" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recepción</h1>
                <p className="text-gray-600">Gestión de citas y pacientes</p>
              </div>
            </div>
            <div className="flex space-x-3">
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
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Citas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.confirmadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-600">{todayStats.completadas}</p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Citas del Día</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                      <p className="text-sm text-gray-500">Dr. {appointment.medicoId.name}</p>
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

          {/* Patient Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Buscar Pacientes</h2>
            </div>
            
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                  <div key={patient._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {patient.nombre} {patient.apellido}
                        </h4>
                        <p className="text-sm text-gray-600">C.I: {patient.cedula}</p>
                        <p className="text-sm text-gray-600">{patient.telefono}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron pacientes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newAppointment.fecha}
                    onChange={(e) => setNewAppointment({...newAppointment, fecha: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <input
                    type="time"
                    required
                    value={newAppointment.hora}
                    onChange={(e) => setNewAppointment({...newAppointment, hora: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
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
                  disabled={!foundPatient}
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