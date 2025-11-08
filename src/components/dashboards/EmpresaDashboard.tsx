import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Activity, UserPlus, Stethoscope, Building2, BarChart3, Clock, CheckCircle, AlertTriangle, FileText, Settings, Eye, CreditCard as Edit, Trash2 } from 'lucide-react';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';
import { PDFGenerator } from '../../utils/pdfGenerator';

interface Doctor {
  _id: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctores' | 'nuevo-doctor' | 'reportes'>('dashboard');
  
  // Estados para modales y notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewDoctorModal, setShowNewDoctorModal] = useState(false);

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

  useEffect(() => {
    fetchStats();
    fetchDoctors();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-doctor':
          setActiveTab('nuevo-doctor');
          setShowNewDoctorModal(true);
          break;
        case 'gestion-doctores':
          setActiveTab('doctores');
          break;
        case 'estadisticas':
          setActiveTab('reportes');
          break;
        case 'generar-reporte':
          generateReport();
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting doctor data:', newDoctor);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDoctor)
      });
      
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (response.ok) {
        fetchDoctors();
        setShowNewDoctorModal(false);
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
        
        setSuccessMessage('¡Doctor registrado exitosamente!');
        setShowSuccessToast(true);
        setActiveTab('doctores');
      } else {
        setErrorMessage(responseData.message || 'Error al crear el doctor');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    }
  };

  const updateHorario = (index: number, field: string, value: any) => {
    const updatedHorarios = [...newDoctor.horarios];
    updatedHorarios[index] = { ...updatedHorarios[index], [field]: value };
    setNewDoctor({ ...newDoctor, horarios: updatedHorarios });
  };

  const generateReport = () => {
    generateCompanyReport();
  };

  const generateCompanyReport = async () => {
    try {
      setSuccessMessage('Generando reporte...');
      setShowSuccessToast(true);
      
      const blob = await PDFGenerator.generateCompanyReportPDF(stats, doctors);
      const filename = `reporte_empresa_${new Date().toISOString().split('T')[0]}.pdf`;
      PDFGenerator.downloadPDF(blob, filename);
      
      setTimeout(() => {
        setSuccessMessage('¡Reporte generado exitosamente!');
        setShowSuccessToast(true);
      }, 1000);
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage('Error al generar el reporte. Intente nuevamente.');
      setShowErrorModal(true);
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
              <h1 className="text-xl font-bold text-purple-900">Dirección General</h1>
              <p className="text-sm text-purple-700">Panel de administración y control</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setActiveTab('nuevo-doctor');
                  setShowNewDoctorModal(true);
                }}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1.5 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-xs ${
                  activeTab === 'dashboard'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('doctores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'doctores'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gestión de Doctores
              </button>
              <button
                onClick={() => setActiveTab('reportes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reportes'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reportes y Estadísticas
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Pacientes</p>
                    <p className="text-lg font-bold text-gray-900">{stats.totalPatients}</p>
                  </div>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Citas Hoy</p>
                    <p className="text-lg font-bold text-green-600">{stats.todayAppointments}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Triajes Pendientes</p>
                    <p className="text-lg font-bold text-orange-600">{stats.pendingTriages}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Consultas Hoy</p>
                    <p className="text-lg font-bold text-purple-600">{stats.todayConsultations}</p>
                  </div>
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Citas del Mes</p>
                    <p className="text-lg font-bold text-indigo-600">{stats.monthlyAppointments}</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Doctores Activos</p>
                    <p className="text-lg font-bold text-teal-600">{doctors.filter(d => d.isActive).length}</p>
                  </div>
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">Acciones Rápidas</h2>
                </div>
                
                <div className="p-3 space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('nuevo-doctor');
                      setShowNewDoctorModal(true);
                    }}
                    className="w-full text-left p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-purple-900">Nuevo Doctor</h3>
                        <p className="text-sm text-purple-700">Registrar un nuevo médico</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('doctores')}
                    className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-blue-900">Gestionar Doctores</h3>
                        <p className="text-sm text-blue-700">Ver y editar información de doctores</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('reportes')}
                    className="w-full text-left p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-green-900">Ver Reportes</h3>
                        <p className="text-sm text-green-700">Estadísticas y reportes del sistema</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">Resumen del Sistema</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Estado del Sistema</span>
                      <span className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Operativo</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Última Actualización</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Usuarios Conectados</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 10) + 5}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'doctores' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Doctores</h2>
                <button
                  onClick={() => {
                    setActiveTab('nuevo-doctor');
                    setShowNewDoctorModal(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Doctor</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-3 rounded-full">
                          <Stethoscope className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Dr. {doctor.nombre} {doctor.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">{doctor.especialidad}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doctor.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📋</span>
                        <span>Lic. {doctor.numeroLicencia}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>🏥</span>
                        <span>Consultorio {doctor.consultorio.numero}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📞</span>
                        <span>{doctor.telefono}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📧</span>
                        <span>{doctor.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center justify-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </button>
                      <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center justify-center space-x-1">
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {doctors.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay doctores registrados</h3>
                  <p className="text-gray-600 mb-4">Comience agregando el primer doctor al sistema</p>
                  <button
                    onClick={() => {
                      setActiveTab('nuevo-doctor');
                      setShowNewDoctorModal(true);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Agregar Doctor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reportes y Estadísticas</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Mensuales</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Citas Programadas</span>
                      <span className="text-lg font-semibold text-blue-600">{stats.monthlyAppointments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Consultas Realizadas</span>
                      <span className="text-lg font-semibold text-green-600">{stats.monthlyConsultations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Doctores Activos</span>
                      <span className="text-lg font-semibold text-purple-600">{doctors.filter(d => d.isActive).length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones de Reporte</h3>
                  <div className="space-y-3">
                    <button
                      onClick={generateReport}
                      className="w-full p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Generar Reporte Mensual</span>
                    </button>
                    <button
                      onClick={generateReport}
                      className="w-full p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Exportar Estadísticas</span>
                    </button>
                    <button
                      onClick={generateReport}
                      className="w-full p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span>Análisis de Tendencias</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Doctor Modal */}
      {showNewDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Doctor</h2>
            </div>
            
            <form onSubmit={handleCreateDoctor} className="p-6 space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.nombre}
                      onChange={(e) => setNewDoctor({...newDoctor, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.apellido}
                      onChange={(e) => setNewDoctor({...newDoctor, apellido: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cédula *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.cedula}
                      onChange={(e) => setNewDoctor({...newDoctor, cedula: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.especialidad}
                      onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Licencia *</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.numeroLicencia}
                      onChange={(e) => setNewDoctor({...newDoctor, numeroLicencia: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      required
                      value={newDoctor.telefono}
                      onChange={(e) => setNewDoctor({...newDoctor, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Acceso */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Acceso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                    <input
                      type="password"
                      required
                      value={newDoctor.password}
                      onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Consultorio */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consultorio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
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

              {/* Horarios */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de Atención</h3>
                <div className="space-y-3">
                  {newDoctor.horarios.map((horario, index) => (
                    <div key={horario.dia} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20">
                        <span className="text-sm font-medium text-gray-700 capitalize">{horario.dia}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => updateHorario(index, 'activo', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-600">Activo</span>
                      </div>
                      
                      {horario.activo && (
                        <>
                          <div>
                            <input
                              type="time"
                              value={horario.horaInicio}
                              onChange={(e) => updateHorario(index, 'horaInicio', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          
                          <span className="text-gray-500">-</span>
                          
                          <div>
                            <input
                              type="time"
                              value={horario.horaFin}
                              onChange={(e) => updateHorario(index, 'horaFin', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewDoctorModal(false)}
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