import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  UserCheck,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileText,
  Building2,
  UserPlus,
  Stethoscope,
  Plus
} from 'lucide-react';

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

const EmpresaDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingTriages: 0,
    todayConsultations: 0,
    monthlyAppointments: 0,
    monthlyConsultations: 0
  });
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors'>('overview');

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
    fetchDashboardStats();
    fetchDoctors();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // No data available
        setStats({
          totalPatients: 0,
          todayAppointments: 0,
          pendingTriages: 0,
          todayConsultations: 0,
          monthlyAppointments: 0,
          monthlyConsultations: 0
        });
      }
    } catch (error) {
      // No data available
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        pendingTriages: 0,
        todayConsultations: 0,
        monthlyAppointments: 0,
        monthlyConsultations: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors`, {
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
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDoctor)
      });
      
      if (response.ok) {
        fetchDoctors();
        setShowNewDoctor(false);
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
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al crear doctor');
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      alert('Error de conexión');
    }
  };

  const updateHorario = (index: number, field: string, value: string | boolean) => {
    const updatedHorarios = [...newDoctor.horarios];
    updatedHorarios[index] = { ...updatedHorarios[index], [field]: value };
    setNewDoctor({ ...newDoctor, horarios: updatedHorarios });
  };

  const kpiCards = [
    {
      title: 'Pacientes Registrados',
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments.toString(),
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Consultas Hoy',
      value: stats.todayConsultations.toString(),
      icon: UserCheck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Triajes Pendientes',
      value: stats.pendingTriages.toString(),
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'Citas del Mes',
      value: stats.monthlyAppointments.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      change: '+22%',
      changeType: 'positive'
    },
    {
      title: 'Ingresos Estimados',
      value: '$45,230',
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      change: '+18%',
      changeType: 'positive'
    }
  ];

  const recentActivities: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-900 animate-fade-in">Dashboard Ejecutivo</h1>
              <p className="text-purple-700">Panel de control gerencial</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-600">Último acceso</p>
                <p className="text-sm font-medium text-purple-900">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              {/* <button
                onClick={() => setShowNewDoctor(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Doctor</span>
              </button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </span>
                    <span className="text-sm text-gray-500">vs mes anterior</span>
                  </div>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <card.icon className={`w-8 h-8 ${card.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Resumen General
                </button>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'doctors'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Doctores ({doctors.length})
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Actividad Reciente
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'appointment' ? 'bg-blue-500' :
                      activity.type === 'consultation' ? 'bg-green-500' :
                      activity.type === 'triage' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Rendimiento Mensual
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Citas Completadas</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '89%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Satisfacción Pacientes</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Eficiencia Operativa</span>
                    <span className="font-medium">76%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '76%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Generar Reporte</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <PieChart className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Ver Estadísticas</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Configuración</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
            </>
          )}

          {activeTab === 'doctors' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Doctores Registrados</h2>
                    <button
                      onClick={() => setShowNewDoctor(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Doctor</span>
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {doctors.length > 0 ? doctors.map((doctor) => (
                    <div key={doctor._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Stethoscope className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Dr. {doctor.nombre} {doctor.apellido}
                              </h3>
                              <p className="text-sm text-gray-600">{doctor.especialidad}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Información Personal</p>
                              <p className="text-sm text-gray-600">C.I: {doctor.cedula}</p>
                              <p className="text-sm text-gray-600">Tel: {doctor.telefono}</p>
                              <p className="text-sm text-gray-600">Email: {doctor.email}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">Consultorio</p>
                              <p className="text-sm text-gray-600">No. {doctor.consultorio.numero}</p>
                              <p className="text-sm text-gray-600">{doctor.consultorio.nombre}</p>
                              <p className="text-sm text-gray-600">Lic: {doctor.numeroLicencia}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Horarios de Atención</p>
                              <div className="space-y-1">
                                {doctor.horarios.filter(h => h.activo).map((horario, index) => (
                                  <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    {horario.dia.charAt(0).toUpperCase() + horario.dia.slice(1)}: {horario.horaInicio} - {horario.horaFin}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                            Editar
                          </button>
                          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                            Ver Citas
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-gray-500">
                      <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay doctores registrados</h3>
                      <p className="text-gray-600">Agrega el primer doctor para comenzar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Doctor Modal */}
      {showNewDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Registrar Nuevo Doctor</h2>
            </div>
            
            <form onSubmit={handleCreateDoctor} className="p-6 space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.nombre}
                      onChange={(e) => setNewDoctor({...newDoctor, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.apellido}
                      onChange={(e) => setNewDoctor({...newDoctor, apellido: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.cedula}
                      onChange={(e) => setNewDoctor({...newDoctor, cedula: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.especialidad}
                      onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Licencia</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.numeroLicencia}
                      onChange={(e) => setNewDoctor({...newDoctor, numeroLicencia: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={newDoctor.telefono}
                      onChange={(e) => setNewDoctor({...newDoctor, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Acceso */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Acceso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={newDoctor.password}
                      onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Consultorio */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consultorio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Consultorio</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.consultorio.numero}
                      onChange={(e) => setNewDoctor({
                        ...newDoctor, 
                        consultorio: {...newDoctor.consultorio, numero: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Consultorio</label>
                    <input
                      type="text"
                      required
                      value={newDoctor.consultorio.nombre}
                      onChange={(e) => setNewDoctor({
                        ...newDoctor, 
                        consultorio: {...newDoctor.consultorio, nombre: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Horarios */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de Atención</h3>
                <div className="space-y-3">
                  {newDoctor.horarios.map((horario, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => updateHorario(index, 'activo', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {horario.dia}
                        </label>
                      </div>
                      
                      <input
                        type="time"
                        value={horario.horaInicio}
                        onChange={(e) => updateHorario(index, 'horaInicio', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      
                      <input
                        type="time"
                        value={horario.horaFin}
                        onChange={(e) => updateHorario(index, 'horaFin', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                  onClick={() => setShowNewDoctor(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Registrar Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresaDashboard;