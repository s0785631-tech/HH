import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  Calendar,
  UserPlus,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Clock,
  Activity
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
import { PDFGenerator } from '../../utils/pdfGenerator';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

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

interface Especialidad {
  _id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

interface Consultorio {
  _id: string;
  numero: string;
  nombre: string;
  ubicacion: string;
  equipamiento: string[];
  activo: boolean;
}

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
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
  isActive: boolean;
}

const EmpresaDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'especialidades' | 'consultorios' | 'patients'>('overview');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [modalEntity, setModalEntity] = useState<'doctor' | 'especialidad' | 'consultorio' | 'patient'>('doctor');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para formularios
  const [formData, setFormData] = useState<any>({});

  const api = useAPI();

  useEffect(() => {
    fetchAllData();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-doctor':
          handleCreate('doctor');
          break;
        case 'gestion-doctores':
          setActiveTab('doctors');
          break;
        case 'estadisticas':
          setActiveTab('overview');
          break;
        case 'generar-reporte':
          generateReport();
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [doctorsData, especialidadesData, consultoriosData, patientsData, statsData] = await Promise.all([
        api.doctors.getAll(),
        fetchEspecialidades(),
        fetchConsultorios(),
        api.patients.getAll(),
        api.dashboard.getStats()
      ]);
      
      setDoctors(doctorsData || []);
      setEspecialidades(especialidadesData || []);
      setConsultorios(consultoriosData || []);
      setPatients(patientsData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Error al cargar los datos');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/especialidades`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching especialidades:', error);
      return [];
    }
  };

  const fetchConsultorios = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultorios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching consultorios:', error);
      return [];
    }
  };

  const handleCreate = (entity: 'doctor' | 'especialidad' | 'consultorio' | 'patient') => {
    setModalEntity(entity);
    setModalType('create');
    setSelectedItem(null);
    setFormData(getEmptyFormData(entity));
    setShowModal(true);
  };

  const handleEdit = (entity: 'doctor' | 'especialidad' | 'consultorio' | 'patient', item: any) => {
    setModalEntity(entity);
    setModalType('edit');
    setSelectedItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (entity: 'doctor' | 'especialidad' | 'consultorio' | 'patient', id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este elemento?')) return;
    
    try {
      switch (entity) {
        case 'doctor':
          await api.doctors.delete(id);
          break;
        case 'especialidad':
          await deleteEspecialidad(id);
          break;
        case 'consultorio':
          await deleteConsultorio(id);
          break;
        case 'patient':
          await api.patients.delete(id);
          break;
      }
      
      fetchAllData();
      setSuccessMessage('¡Elemento eliminado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar el elemento');
      setShowErrorModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        switch (modalEntity) {
          case 'doctor':
            await api.doctors.create(formData);
            break;
          case 'especialidad':
            await createEspecialidad(formData);
            break;
          case 'consultorio':
            await createConsultorio(formData);
            break;
          case 'patient':
            await api.patients.create(formData);
            break;
        }
        setSuccessMessage('¡Elemento creado exitosamente!');
      } else {
        switch (modalEntity) {
          case 'doctor':
            await api.doctors.update(selectedItem._id, formData);
            break;
          case 'especialidad':
            await updateEspecialidad(selectedItem._id, formData);
            break;
          case 'consultorio':
            await updateConsultorio(selectedItem._id, formData);
            break;
          case 'patient':
            await api.patients.update(selectedItem._id, formData);
            break;
        }
        setSuccessMessage('¡Elemento actualizado exitosamente!');
      }
      
      setShowModal(false);
      fetchAllData();
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al guardar el elemento');
      setShowErrorModal(true);
    }
  };

  // Funciones para especialidades
  const createEspecialidad = async (data: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/especialidades`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error creating especialidad');
  };

  const updateEspecialidad = async (id: string, data: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/especialidades/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error updating especialidad');
  };

  const deleteEspecialidad = async (id: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/especialidades/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Error deleting especialidad');
  };

  // Funciones para consultorios
  const createConsultorio = async (data: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultorios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error creating consultorio');
  };

  const updateConsultorio = async (id: string, data: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultorios/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error updating consultorio');
  };

  const deleteConsultorio = async (id: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultorios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Error deleting consultorio');
  };

  const getEmptyFormData = (entity: string) => {
    switch (entity) {
      case 'doctor':
        return {
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
          horarios: []
        };
      case 'especialidad':
        return {
          nombre: '',
          descripcion: '',
          activa: true
        };
      case 'consultorio':
        return {
          numero: '',
          nombre: '',
          ubicacion: '',
          equipamiento: [],
          activo: true
        };
      case 'patient':
        return {
          nombre: '',
          apellido: '',
          cedula: '',
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
        };
      default:
        return {};
    }
  };

  const generateReport = async () => {
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

  const filteredData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
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
              <p className="text-purple-700">Gestión administrativa y reportes</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80"
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
                <p className="text-sm font-medium text-gray-600">Total Doctores</p>
                <p className="text-2xl font-bold text-purple-600">{doctors.length}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Especialidades</p>
                <p className="text-2xl font-bold text-blue-600">{especialidades.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultorios</p>
                <p className="text-2xl font-bold text-green-600">{consultorios.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-orange-600">{patients.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Resumen', icon: BarChart3 },
                { id: 'doctors', label: 'Doctores', icon: Stethoscope },
                { id: 'especialidades', label: 'Especialidades', icon: Activity },
                { id: 'consultorios', label: 'Consultorios', icon: Building2 },
                { id: 'patients', label: 'Pacientes', icon: Users }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Citas del día:</span>
                  <span className="font-semibold">{stats.todayAppointments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultas del día:</span>
                  <span className="font-semibold">{stats.todayConsultations || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Triajes pendientes:</span>
                  <span className="font-semibold">{stats.pendingTriages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citas del mes:</span>
                  <span className="font-semibold">{stats.monthlyAppointments || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleCreate('doctor')}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Doctor</span>
                </button>
                <button
                  onClick={generateReport}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Doctores</h2>
              <button
                onClick={() => handleCreate('doctor')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredData(doctors, ['nombre', 'apellido', 'especialidad', 'cedula']).map((doctor) => (
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
                          <span className="font-medium">Cédula:</span> {doctor.cedula}
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
                        onClick={() => handleEdit('doctor', doctor)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar doctor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('doctor', doctor._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'especialidades' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Especialidades</h2>
              <button
                onClick={() => handleCreate('especialidad')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Especialidad</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredData(especialidades, ['nombre', 'descripcion']).map((especialidad) => (
                <div key={especialidad._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{especialidad.nombre}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          especialidad.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {especialidad.activa ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </div>
                      <p className="text-gray-600">{especialidad.descripcion}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit('especialidad', especialidad)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar especialidad"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('especialidad', especialidad._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar especialidad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'consultorios' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Consultorios</h2>
              <button
                onClick={() => handleCreate('consultorio')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Consultorio</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredData(consultorios, ['numero', 'nombre', 'ubicacion']).map((consultorio) => (
                <div key={consultorio._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Consultorio {consultorio.numero} - {consultorio.nombre}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          consultorio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {consultorio.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <div>
                          <span className="font-medium">Ubicación:</span> {consultorio.ubicacion}
                        </div>
                        {consultorio.equipamiento.length > 0 && (
                          <div>
                            <span className="font-medium">Equipamiento:</span> {consultorio.equipamiento.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit('consultorio', consultorio)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar consultorio"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('consultorio', consultorio._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar consultorio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Pacientes</h2>
              <button
                onClick={() => handleCreate('patient')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Paciente</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredData(patients, ['nombre', 'apellido', 'cedula']).map((patient) => (
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
                        {patient.email && (
                          <div>
                            <span className="font-medium">Email:</span> {patient.email}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Dirección:</span> {patient.direccion}
                        </div>
                        <div>
                          <span className="font-medium">Emergencia:</span> {patient.contactoEmergencia.nombre}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit('patient', patient)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('patient', patient._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'create' ? 'Crear' : 'Editar'} {
                  modalEntity === 'doctor' ? 'Doctor' :
                  modalEntity === 'especialidad' ? 'Especialidad' :
                  modalEntity === 'consultorio' ? 'Consultorio' : 'Paciente'
                }
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {modalEntity === 'doctor' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombre || ''}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formData.apellido || ''}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cédula *</label>
                      <input
                        type="text"
                        required
                        value={formData.cedula || ''}
                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad *</label>
                      <select
                        required
                        value={formData.especialidad || ''}
                        onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar especialidad</option>
                        {especialidades.filter(e => e.activa).map(esp => (
                          <option key={esp._id} value={esp.nombre}>{esp.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número de Licencia *</label>
                      <input
                        type="text"
                        required
                        value={formData.numeroLicencia || ''}
                        onChange={(e) => setFormData({...formData, numeroLicencia: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        required
                        value={formData.telefono || ''}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {modalType === 'create' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                        <input
                          type="password"
                          required
                          value={formData.password || ''}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número de Consultorio *</label>
                      <input
                        type="text"
                        required
                        value={formData.consultorio?.numero || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          consultorio: {...formData.consultorio, numero: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Consultorio *</label>
                      <input
                        type="text"
                        required
                        value={formData.consultorio?.nombre || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          consultorio: {...formData.consultorio, nombre: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalEntity === 'especialidad' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.activa || false}
                        onChange={(e) => setFormData({...formData, activa: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Especialidad activa</span>
                    </label>
                  </div>
                </>
              )}

              {modalEntity === 'consultorio' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                      <input
                        type="text"
                        required
                        value={formData.numero || ''}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombre || ''}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>
                    <input
                      type="text"
                      required
                      value={formData.ubicacion || ''}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipamiento</label>
                    <textarea
                      rows={3}
                      placeholder="Separar equipos con comas"
                      value={formData.equipamiento?.join(', ') || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        equipamiento: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.activo || false}
                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Consultorio activo</span>
                    </label>
                  </div>
                </>
              )}

              {modalEntity === 'patient' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombre || ''}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formData.apellido || ''}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cédula *</label>
                      <input
                        type="text"
                        required
                        value={formData.cedula || ''}
                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        required
                        value={formData.fechaNacimiento || ''}
                        onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        required
                        value={formData.telefono || ''}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
                      <select
                        required
                        value={formData.genero || 'M'}
                        onChange={(e) => setFormData({...formData, genero: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.direccion || ''}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactoEmergencia?.nombre || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactoEmergencia: {
                              ...formData.contactoEmergencia,
                              nombre: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                        <input
                          type="tel"
                          required
                          value={formData.contactoEmergencia?.telefono || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactoEmergencia: {
                              ...formData.contactoEmergencia,
                              telefono: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactoEmergencia?.relacion || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactoEmergencia: {
                              ...formData.contactoEmergencia,
                              relacion: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {modalType === 'create' ? 'Crear' : 'Actualizar'}
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