import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  Stethoscope, 
  Clock, 
  User, 
  Heart, 
  Thermometer, 
  Activity,
  Building2,
  UserPlus,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  Shield,
  Search,
  Edit,
  Trash2,
  Eye,
  Plus,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  GraduationCap
} from 'lucide-react';

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

interface RecentActivity {
  appointments: any[];
  triages: any[];
  consultations: any[];
}

const EmpresaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'new-doctor' | 'reports' | 'config'>('dashboard');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingTriages: 0,
    todayConsultations: 0,
    monthlyAppointments: 0,
    monthlyConsultations: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity>({
    appointments: [],
    triages: [],
    consultations: []
  });
  const [loading, setLoading] = useState(true);
  const [showNewDoctorModal, setShowNewDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    fetchDashboardData();
    fetchDoctors();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-doctor':
          setActiveTab('new-doctor');
          break;
        case 'gestion-doctores':
          setActiveTab('doctors');
          break;
        case 'configuracion':
          setActiveTab('config');
          break;
        case 'estadisticas':
        case 'generar-reporte':
          setActiveTab('reports');
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/dashboard/recent-activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      if (response.ok) {
        fetchDoctors();
        setShowNewDoctorModal(false);
        resetNewDoctorForm();
        alert('Doctor creado exitosamente');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al crear doctor');
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      alert('Error de conexión');
    }
  };

  const resetNewDoctorForm = () => {
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
  };

  const updateHorario = (index: number, field: string, value: string | boolean) => {
    const updatedHorarios = [...newDoctor.horarios];
    updatedHorarios[index] = { ...updatedHorarios[index], [field]: value };
    setNewDoctor({ ...newDoctor, horarios: updatedHorarios });
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.cedula.includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-900 animate-fade-in">Dirección General</h1>
              <p className="text-purple-700">Panel de administración y control</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('new-doctor')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reportes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
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
                onClick={() => setActiveTab('new-doctor')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'new-doctor'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nuevo Doctor
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reportes y Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Configuración
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard General */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                    <p className="text-xs text-green-600 mt-1">+12% este mes</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
                    <p className="text-xs text-blue-600 mt-1">En curso</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Doctores Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{doctors.filter(d => d.isActive).length}</p>
                    <p className="text-xs text-purple-600 mt-1">De {doctors.length} total</p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(15750000)}</p>
                    <p className="text-xs text-green-600 mt-1">+8% vs mes anterior</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento Mensual</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Consultas Completadas</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Satisfacción Pacientes</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Eficiencia Operativa</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">78%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                  {recentActivities.appointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Nueva cita programada
                        </p>
                        <p className="text-xs text-gray-600">
                          {appointment.pacienteId?.nombre} - {new Date(appointment.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.consultations.slice(0, 3).map((consultation, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Consulta completada
                        </p>
                        <p className="text-xs text-gray-600">
                          {consultation.pacienteId?.nombre} - {new Date(consultation.fechaHora).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gestión de Doctores */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Gestión de Doctores</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Buscar doctores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => setActiveTab('new-doctor')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Doctor</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
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
                          <User className="w-4 h-4" />
                          <span>C.I: {doctor.cedula}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>Lic: {doctor.numeroLicencia}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{doctor.telefono}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{doctor.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>Consultorio {doctor.consultorio.numero} - {doctor.consultorio.nombre}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Horarios de Atención</h4>
                        <div className="space-y-1">
                          {doctor.horarios.filter(h => h.activo).map((horario, index) => (
                            <div key={index} className="flex justify-between text-xs text-gray-600">
                              <span className="capitalize">{horario.dia}</span>
                              <span>{horario.horaInicio} - {horario.horaFin}</span>
                            </div>
                          ))}
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
                        <button className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredDoctors.length === 0 && (
                  <div className="text-center py-12">
                    <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron doctores</h3>
                    <p className="text-gray-600">
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo doctor'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nuevo Doctor */}
        {activeTab === 'new-doctor' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Registrar Nuevo Doctor</h2>
              <p className="text-sm text-gray-600">Complete la información del doctor y configure sus horarios de atención</p>
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
                    <select
                      required
                      value={newDoctor.especialidad}
                      onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar especialidad</option>
                      <option value="Medicina General">Medicina General</option>
                      <option value="Cardiología">Cardiología</option>
                      <option value="Dermatología">Dermatología</option>
                      <option value="Ginecología">Ginecología</option>
                      <option value="Pediatría">Pediatría</option>
                      <option value="Neurología">Neurología</option>
                      <option value="Ortopedia">Ortopedia</option>
                      <option value="Psiquiatría">Psiquiatría</option>
                      <option value="Oftalmología">Oftalmología</option>
                      <option value="Otorrinolaringología">Otorrinolaringología</option>
                    </select>
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
                      placeholder="Contraseña para acceso al sistema"
                    />
                  </div>
                </div>
              </div>

              {/* Consultorio */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consultorio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Consultorio *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Consultorio *</label>
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
                    <div key={index} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => updateHorario(index, 'activo', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{horario.dia}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hora Inicio</label>
                        <input
                          type="time"
                          value={horario.horaInicio}
                          onChange={(e) => updateHorario(index, 'horaInicio', e.target.value)}
                          disabled={!horario.activo}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hora Fin</label>
                        <input
                          type="time"
                          value={horario.horaFin}
                          onChange={(e) => updateHorario(index, 'horaFin', e.target.value)}
                          disabled={!horario.activo}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {horario.activo ? 'Disponible' : 'No disponible'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('doctors');
                    resetNewDoctorForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Doctor</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reportes y Estadísticas */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reportes Rápidos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Reportes Rápidos</h2>
                </div>
                <div className="p-6 space-y-4">
                  <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-900">Reporte Mensual</h3>
                          <p className="text-sm text-blue-700">Estadísticas del mes actual</p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                  </button>

                  <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-medium text-green-900">Reporte de Pacientes</h3>
                          <p className="text-sm text-green-700">Lista completa de pacientes</p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-green-600" />
                    </div>
                  </button>

                  <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                        <div>
                          <h3 className="font-medium text-purple-900">Reporte Financiero</h3>
                          <p className="text-sm text-purple-700">Ingresos y gastos</p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                  </button>

                  <button className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Stethoscope className="w-6 h-6 text-orange-600" />
                        <div>
                          <h3 className="font-medium text-orange-900">Reporte de Doctores</h3>
                          <p className="text-sm text-orange-700">Rendimiento por doctor</p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-orange-600" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Estadísticas Avanzadas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Estadísticas Avanzadas</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Especialidad</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Medicina General', value: 35, color: 'bg-blue-500' },
                          { name: 'Cardiología', value: 20, color: 'bg-red-500' },
                          { name: 'Pediatría', value: 15, color: 'bg-green-500' },
                          { name: 'Ginecología', value: 12, color: 'bg-purple-500' },
                          { name: 'Otras', value: 18, color: 'bg-gray-500' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-8">{item.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Tendencia de Citas (Últimos 7 días)</h4>
                      <div className="space-y-2">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                          <div key={dia} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 w-8">{dia}</span>
                            <div className="flex items-center space-x-3 flex-1 ml-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.random() * 80 + 20}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-8">
                                {Math.floor(Math.random() * 30) + 10}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros de Reportes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Generar Reporte Personalizado</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Citas</option>
                      <option>Pacientes</option>
                      <option>Doctores</option>
                      <option>Financiero</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                    </select>
                  </div>
                </div>
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Generar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuración */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración General */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Configuración General</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Clínica</label>
                    <input
                      type="text"
                      defaultValue="SAVISER - Servicio de Apoyo a la Vida del Ser Humano"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <textarea
                      rows={3}
                      defaultValue="Calle 123 #45-67, Bogotá, Colombia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Principal</label>
                    <input
                      type="tel"
                      defaultValue="+57 1 234 5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                    <input
                      type="email"
                      defaultValue="contacto@saviser.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de Sistema */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Configuración del Sistema</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificaciones por Email</h4>
                      <p className="text-sm text-gray-600">Enviar notificaciones automáticas</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Recordatorios de Citas</h4>
                      <p className="text-sm text-gray-600">Enviar recordatorios 24h antes</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Backup Automático</h4>
                      <p className="text-sm text-gray-600">Respaldo diario de datos</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duración de Citas (minutos)</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="15">15 minutos</option>
                      <option value="30" selected>30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuarios y Permisos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Usuarios y Permisos</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { role: 'Empresa', users: 1, permissions: 'Acceso completo al sistema' },
                    { role: 'Recepción', users: 3, permissions: 'Gestión de citas y pacientes' },
                    { role: 'Consultorio', users: doctors.length, permissions: 'Consultas médicas y historiales' },
                    { role: 'Enfermería', users: 2, permissions: 'Triaje y signos vitales' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.role}</h4>
                        <p className="text-sm text-gray-600">{item.permissions}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.users} usuarios</p>
                        <button className="text-sm text-purple-600 hover:text-purple-700">Gestionar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresaDashboard;