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
  Building2
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/SAVISER.png" 
                alt="SAVISER" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
                <p className="text-gray-600">Panel de control gerencial</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Último acceso</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default EmpresaDashboard;