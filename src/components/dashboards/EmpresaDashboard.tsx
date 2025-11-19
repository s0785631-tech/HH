import React, { useState, useEffect } from 'react';
import { automation } from '../../services/automationService';
import { 
  Building2, 
  Users, 
  Calendar, 
  BarChart3, 
  UserPlus,
  Stethoscope,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
import { PDFGenerator } from '../../utils/pdfGenerator';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTriages: number;
  todayConsultations: number;
  monthlyAppointments: number;
  monthlyConsultations: number;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'reports'>('overview');
  
  // Estados para modales
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estado para nuevo doctor
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
      { dia: 'viernes', horaInicio: '08:00', horaFin: '17:00', activo: true }
    ]
  });

  const api = useAPI();

  useEffect(() => {
    fetchData();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-doctor':
          setActiveTab('doctors');
          setShowDoctorModal(true);
          break;
        case 'gestion-doctores':
          setActiveTab('doctors');
          break;
        case 'estadisticas':
          setActiveTab('overview');
          break;
        case 'generar-reporte':
          setActiveTab('reports');
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, doctorsData] = await Promise.all([
        api.dashboard.getStats(),
        api.doctors.getAll()
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
          { dia: 'viernes', horaInicio: '08:00', horaFin: '17:00', activo: true }
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

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    
    try {
      await api.doctors.update(selectedDoctor._id, selectedDoctor);
      setShowEditModal(false);
      setSelectedDoctor(null);
      fetchData();
      setSuccessMessage('¡Doctor actualizado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al actualizar el doctor');
      setShowErrorModal(true);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este doctor?')) return;
    
    try {
      await api.doctors.delete(id);
      fetchData();
      setSuccessMessage('¡Doctor eliminado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar el doctor');
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
      console.error('Error generating report:', error);
      setErrorMessage('Error al generar el reporte');
      setShowErrorModal(true);
    }
  };

  const updateHorario = (index: number, field: string, value: any) => {
    if (selectedDoctor) {
      const updatedHorarios = [...selectedDoctor.horarios];
      updatedHorarios[index] = { ...updatedHorarios[index], [field]: value };
      setSelectedDoctor({ ...selectedDoctor, horarios: updatedHorarios });
    }
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
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doctores Activos</p>
                <p className="text-2xl font-bold text-green-600">{doctors.filter(d => d.isActive).length}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Resumen General
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'doctors'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gestión de Doctores ({doctors.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Mes</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Citas Programadas</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.monthlyAppointments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Consultas Realizadas</span>
                  <span className="text-2xl font-bold text-green-600">{stats.monthlyConsultations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Triajes Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.pendingTriages}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowDoctorModal(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Agregar Nuevo Doctor</span>
                </button>
                <button
                  onClick={generateCompanyReport}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Generar Reporte Ejecutivo</span>
                </button>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Gestionar Personal Médico</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Personal Médico</h2>
              <button
                onClick={() => setShowDoctorModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {doctors.length > 0 ? doctors.map((doctor) => (
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
                      
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-700">Horarios:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {doctor.horarios.filter(h => h.activo).map((horario, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {horario.dia}: {horario.horaInicio} - {horario.horaFin}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditDoctor(doctor)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar doctor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor._id)}
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

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Generación de Reportes</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Reporte Ejecutivo</h3>
                      <p className="text-sm text-gray-600">Estadísticas generales y personal médico</p>
                    </div>
                  </div>
                  <button
                    onClick={generateCompanyReport}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generar PDF</span>
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow opacity-50">
                  <div className="flex items-center space-x-3 mb-4">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Reporte de Rendimiento</h3>
                      <p className="text-sm text-gray-600">Métricas de productividad mensual</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Próximamente</span>
                  </button>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctor.especialidad}
                    onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
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
                      consultorio: { ...newDoctor.consultorio, numero: e.target.value }
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
                      consultorio: { ...newDoctor.consultorio, nombre: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
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

      {/* Edit Doctor Modal */}
      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Doctor</h2>
            </div>
            
            <form onSubmit={handleUpdateDoctor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedDoctor.nombre}
                    onChange={(e) => setSelectedDoctor({...selectedDoctor, nombre: e.target.value})}
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
                    value={selectedDoctor.apellido}
                    onChange={(e) => setSelectedDoctor({...selectedDoctor, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedDoctor.especialidad}
                    onChange={(e) => setSelectedDoctor({...selectedDoctor, especialidad: e.target.value})}
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
                    value={selectedDoctor.telefono}
                    onChange={(e) => setSelectedDoctor({...selectedDoctor, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={selectedDoctor.email}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Consultorio *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedDoctor.consultorio.numero}
                    onChange={(e) => setSelectedDoctor({
                      ...selectedDoctor,
                      consultorio: { ...selectedDoctor.consultorio, numero: e.target.value }
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
                    value={selectedDoctor.consultorio.nombre}
                    onChange={(e) => setSelectedDoctor({
                      ...selectedDoctor,
                      consultorio: { ...selectedDoctor.consultorio, nombre: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Horarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Horarios de Atención
                </label>
                <div className="space-y-3">
                  {selectedDoctor.horarios.map((horario, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => updateHorario(index, 'activo', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium capitalize">{horario.dia}</span>
                      </div>
                      <input
                        type="time"
                        value={horario.horaInicio}
                        onChange={(e) => updateHorario(index, 'horaInicio', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      <input
                        type="time"
                        value={horario.horaFin}
                        onChange={(e) => updateHorario(index, 'horaFin', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      <span className="text-sm text-gray-500">
                        {horario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Actualizar Doctor
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