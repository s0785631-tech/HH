import React, { useState, useEffect } from 'react';
import { automation } from '../../services/automationService';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  BarChart3, 
  UserPlus, 
  FileText, 
  Settings,
  TrendingUp,
  Calendar,
  Activity,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Plus,
  X
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
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
  isActive: boolean;
  createdAt: string;
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
  createdAt: string;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTriages: number;
  todayConsultations: number;
  monthlyAppointments: number;
  monthlyConsultations: number;
}

const EmpresaDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingTriages: 0,
    todayConsultations: 0,
    monthlyAppointments: 0,
    monthlyConsultations: 0
  });
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctores' | 'pacientes' | 'reportes'>('dashboard');
  
  // Estados para modales
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editType, setEditType] = useState<'doctor' | 'patient'>('doctor');
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Estados para formularios
  const [newDoctor, setNewDoctor] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    especialidad: '',
    numeroLicencia: '',
    telefono: '',
    email: '',
    password: '',
    consultorio: {
      numero: '',
      nombre: ''
    },
    horarios: [
      { dia: 'lunes', horaInicio: '08:00', horaFin: '17:00', activo: true },
      { dia: 'martes', horaInicio: '08:00', horaFin: '17:00', activo: true },
      { dia: 'miercoles', horaInicio: '08:00', horaFin: '17:00', activo: true },
      { dia: 'jueves', horaInicio: '08:00', horaFin: '17:00', activo: true },
      { dia: 'viernes', horaInicio: '08:00', horaFin: '17:00', activo: true },
      { dia: 'sabado', horaInicio: '08:00', horaFin: '12:00', activo: false },
      { dia: 'domingo', horaInicio: '08:00', horaFin: '12:00', activo: false }
    ]
  });

  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
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

  const api = useAPI();

  useEffect(() => {
    fetchData();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-doctor':
          setActiveTab('doctores');
          setShowDoctorModal(true);
          break;
        case 'gestion-doctores':
          setActiveTab('doctores');
          break;
        case 'estadisticas':
          setActiveTab('reportes');
          break;
        case 'generar-reporte':
          generateCompanyReport();
          break;
        case 'configuracion':
          // Implementar configuración
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  useEffect(() => {
    // Filtrar doctores
    const filtered = doctors.filter(doctor =>
      doctor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.cedula.includes(searchTerm)
    );
    setFilteredDoctors(filtered);

    // Filtrar pacientes
    const filteredPats = patients.filter(patient =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cedula.includes(searchTerm)
    );
    setFilteredPatients(filteredPats);
  }, [searchTerm, doctors, patients]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, doctorsData, patientsData] = await Promise.all([
        api.dashboard.getStats(),
        api.doctors.getAll(),
        api.patients.getAll()
      ]);
      
      setStats(statsData || {
        totalPatients: 0,
        todayAppointments: 0,
        pendingTriages: 0,
        todayConsultations: 0,
        monthlyAppointments: 0,
        monthlyConsultations: 0
      });
      setDoctors(doctorsData || []);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Error al cargar los datos');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.doctors.create(newDoctor);
      setShowDoctorModal(false);
      setNewDoctor({
        nombre: '',
        apellido: '',
        cedula: '',
        especialidad: '',
        numeroLicencia: '',
        telefono: '',
        email: '',
        password: '',
        consultorio: {
          numero: '',
          nombre: ''
        },
        horarios: [
          { dia: 'lunes', horaInicio: '08:00', horaFin: '17:00', activo: true },
          { dia: 'martes', horaInicio: '08:00', horaFin: '17:00', activo: true },
          { dia: 'miercoles', horaInicio: '08:00', horaFin: '17:00', activo: true },
          { dia: 'jueves', horaInicio: '08:00', horaFin: '17:00', activo: true },
          { dia: 'viernes', horaInicio: '08:00', horaFin: '17:00', activo: true },
          { dia: 'sabado', horaInicio: '08:00', horaFin: '12:00', activo: false },
          { dia: 'domingo', horaInicio: '08:00', horaFin: '12:00', activo: false }
        ]
      });
      fetchData();
      setSuccessMessage('¡Doctor creado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al crear el doctor');
      setShowErrorModal(true);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patients.create(newPatient);
      setShowPatientModal(false);
      setNewPatient({
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
      fetchData();
      setSuccessMessage('¡Paciente creado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al crear el paciente');
      setShowErrorModal(true);
    }
  };

  const handleEdit = (item: any, type: 'doctor' | 'patient') => {
    setSelectedItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editType === 'doctor') {
        await api.doctors.update(selectedItem._id, selectedItem);
      } else {
        await api.patients.update(selectedItem._id, selectedItem);
      }
      setShowEditModal(false);
      setSelectedItem(null);
      fetchData();
      setSuccessMessage('¡Actualizado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al actualizar');
      setShowErrorModal(true);
    }
  };

  const handleDelete = async (id: string, type: 'doctor' | 'patient') => {
    if (!confirm('¿Está seguro de que desea eliminar este elemento?')) return;
    
    try {
      if (type === 'doctor') {
        await api.doctors.delete(id);
      } else {
        await api.patients.delete(id);
      }
      fetchData();
      setSuccessMessage('¡Eliminado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar');
      setShowErrorModal(true);
    }
  };

  const generateCompanyReport = async () => {
    try {
      const blob = await PDFGenerator.generateCompanyReportPDF(stats, doctors);
      const filename = `reporte_empresa_${new Date().toISOString().split('T')[0]}.pdf`;
      PDFGenerator.downloadPDF(blob, filename);
      
      setSuccessMessage('¡Reporte generado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al generar el reporte');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-purple-900">Dashboard Ejecutivo</h1>
              <p className="text-purple-700">Gestión integral del centro médico SAVISER</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar doctores o pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard General
              </button>
              <button
                onClick={() => setActiveTab('doctores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'doctores'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Doctores ({filteredDoctors.length})
              </button>
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pacientes'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pacientes ({filteredPatients.length})
              </button>
              <button
                onClick={() => setActiveTab('reportes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reportes'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reportes
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Triajes Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingTriages}</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Consultas Hoy</p>
                    <p className="text-2xl font-bold text-green-600">{stats.todayConsultations}</p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Citas del Mes</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.monthlyAppointments}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Doctores Activos</p>
                    <p className="text-2xl font-bold text-teal-600">{doctors.filter(d => d.isActive).length}</p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowDoctorModal(true)}
                  className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <UserPlus className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-600">Nuevo Doctor</p>
                </button>
                
                <button
                  onClick={() => setShowPatientModal(true)}
                  className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Nuevo Paciente</p>
                </button>
                
                <button
                  onClick={generateCompanyReport}
                  className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-600">Generar Reporte</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('reportes')}
                  className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-600">Ver Estadísticas</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctores' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Doctores</h2>
              <button
                onClick={() => setShowDoctorModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredDoctors.length > 0 ? filteredDoctors.map((doctor) => (
                <div key={doctor._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.nombre} {doctor.apellido}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Especialidad:</span> {doctor.especialidad}
                        </div>
                        <div>
                          <span className="font-medium">Licencia:</span> {doctor.numeroLicencia}
                        </div>
                        <div>
                          <span className="font-medium">C.I:</span> {doctor.cedula}
                        </div>
                        <div>
                          <span className="font-medium">Teléfono:</span> {doctor.telefono}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {doctor.email}
                        </div>
                        <div>
                          <span className="font-medium">Consultorio:</span> {doctor.consultorio.numero} - {doctor.consultorio.nombre}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(doctor, 'doctor')}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar doctor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doctor._id, 'doctor')}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay doctores registrados</h3>
                  <p className="text-gray-600">Comience agregando un nuevo doctor</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pacientes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Pacientes</h2>
              <button
                onClick={() => setShowPatientModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Paciente</span>
              </button>
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
                          patient.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">C.I:</span> {patient.cedula}
                        </div>
                        <div>
                          <span className="font-medium">Teléfono:</span> {patient.telefono}
                        </div>
                        <div>
                          <span className="font-medium">Género:</span> {patient.genero === 'M' ? 'Masculino' : 'Femenino'}
                        </div>
                        <div>
                          <span className="font-medium">Afiliación:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            patient.tipoAfiliacion === 'contributivo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {patient.tipoAfiliacion.toUpperCase()}
                          </span>
                        </div>
                        {patient.eps && (
                          <div>
                            <span className="font-medium">EPS:</span> {patient.eps}
                          </div>
                        )}
                        {patient.email && (
                          <div>
                            <span className="font-medium">Email:</span> {patient.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(patient, 'patient')}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(patient._id, 'patient')}
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
                  <p className="text-gray-600">Comience agregando un nuevo paciente</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Generales</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de pacientes:</span>
                  <span className="font-semibold">{stats.totalPatients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citas programadas hoy:</span>
                  <span className="font-semibold text-blue-600">{stats.todayAppointments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultas realizadas hoy:</span>
                  <span className="font-semibold text-green-600">{stats.todayConsultations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Triajes pendientes:</span>
                  <span className="font-semibold text-orange-600">{stats.pendingTriages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctores activos:</span>
                  <span className="font-semibold text-purple-600">{doctors.filter(d => d.isActive).length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generar Reportes</h3>
              <div className="space-y-3">
                <button
                  onClick={generateCompanyReport}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Reporte Ejecutivo Completo</span>
                </button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>El reporte incluye estadísticas generales, información de doctores y métricas de rendimiento.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Doctor</h2>
            </div>
            
            <form onSubmit={handleCreateDoctor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctor.nombre}
                    onChange={(e) => setNewDoctor({...newDoctor, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctor.apellido}
                    onChange={(e) => setNewDoctor({...newDoctor, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    value={newDoctor.cedula}
                    onChange={(e) => setNewDoctor({...newDoctor, cedula: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad *
                  </label>
                  <select
                    required
                    value={newDoctor.especialidad}
                    onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar especialidad</option>
                    <option value="Medicina General">Medicina General</option>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Ginecología">Ginecología</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Neurología">Neurología</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Psiquiatría">Psiquiatría</option>
                    <option value="Oftalmología">Oftalmología</option>
                    <option value="Otorrinolaringología">Otorrinolaringología</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Licencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctor.numeroLicencia}
                    onChange={(e) => setNewDoctor({...newDoctor, numeroLicencia: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newDoctor.telefono}
                    onChange={(e) => setNewDoctor({...newDoctor, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Consultorio</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Consultorio *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoctor.consultorio.numero}
                      onChange={(e) => setNewDoctor({
                        ...newDoctor,
                        consultorio: {...newDoctor.consultorio, numero: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Consultorio *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoctor.consultorio.nombre}
                      onChange={(e) => setNewDoctor({
                        ...newDoctor,
                        consultorio: {...newDoctor.consultorio, nombre: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Crear Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género *
                  </label>
                  <select
                    required
                    value={newPatient.genero}
                    onChange={(e) => setNewPatient({...newPatient, genero: e.target.value as 'M' | 'F'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Afiliación *
                  </label>
                  <select
                    required
                    value={newPatient.tipoAfiliacion}
                    onChange={(e) => setNewPatient({...newPatient, tipoAfiliacion: e.target.value as 'contributivo' | 'subsidiado'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="contributivo">Contributivo</option>
                    <option value="subsidiado">Subsidiado</option>
                  </select>
                </div>
                
                {newPatient.tipoAfiliacion === 'contributivo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EPS *
                    </label>
                    <select
                      required
                      value={newPatient.eps}
                      onChange={(e) => setNewPatient({...newPatient, eps: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar EPS</option>
                      <option value="Sura">Sura</option>
                      <option value="Sanitas">Sanitas</option>
                      <option value="Compensar">Compensar</option>
                      <option value="Famisanar">Famisanar</option>
                      <option value="Nueva EPS">Nueva EPS</option>
                      <option value="Salud Total">Salud Total</option>
                      <option value="Coomeva">Coomeva</option>
                      <option value="Medimás">Medimás</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newPatient.direccion}
                  onChange={(e) => setNewPatient({...newPatient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      value={newPatient.contactoEmergencia?.nombre}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {
                          ...newPatient.contactoEmergencia!,
                          nombre: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatient.contactoEmergencia?.telefono}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {
                          ...newPatient.contactoEmergencia!,
                          telefono: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relación *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.contactoEmergencia?.relacion}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        contactoEmergencia: {
                          ...newPatient.contactoEmergencia!,
                          relacion: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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

export default EmpresaDashboard;