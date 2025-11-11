import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  Pause, 
  BarChart3, 
  Clock, 
  Bell, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Activity,
  Users,
  Calendar,
  Stethoscope
} from 'lucide-react';
import { automationService, AutomationRule } from '../services/automationService';

interface AutomationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AutomationPanel: React.FC<AutomationPanelProps> = ({ isOpen, onClose }) => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    executedToday: 0
  });
  const [activeTab, setActiveTab] = useState<'rules' | 'stats' | 'logs'>('rules');

  useEffect(() => {
    if (isOpen) {
      loadAutomationData();
    }
  }, [isOpen]);

  const loadAutomationData = () => {
    // Obtener reglas y estadísticas del servicio de automatización
    const automationStats = automationService.getAutomationStats();
    setStats(automationStats);
    
    // Simular reglas (en una implementación real, estas vendrían del servicio)
    const mockRules: AutomationRule[] = [
      {
        id: 'appointment-reminder-24h',
        name: 'Recordatorio de cita 24 horas antes',
        trigger: 'time',
        conditions: [],
        actions: [],
        isActive: true,
        lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
      },
      {
        id: 'triage-priority-alert',
        name: 'Alerta de triaje de prioridad alta',
        trigger: 'event',
        conditions: [],
        actions: [],
        isActive: true,
        lastExecuted: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
      },
      {
        id: 'patient-follow-up',
        name: 'Seguimiento automático post-consulta',
        trigger: 'time',
        conditions: [],
        actions: [],
        isActive: false
      },
      {
        id: 'appointment-auto-confirm',
        name: 'Confirmación automática de citas',
        trigger: 'time',
        conditions: [],
        actions: [],
        isActive: true,
        lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 horas atrás
      },
      {
        id: 'doctor-workload-balance',
        name: 'Balance automático de carga de trabajo',
        trigger: 'event',
        conditions: [],
        actions: [],
        isActive: true
      }
    ];
    
    setRules(mockRules);
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
    
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      automationService.toggleRule(ruleId, !rule.isActive);
    }
  };

  const getRuleIcon = (trigger: string) => {
    switch (trigger) {
      case 'time': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'event': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'condition': return <Activity className="w-5 h-5 text-green-500" />;
      default: return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatLastExecuted = (date?: Date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Zap className="w-6 h-6 text-purple-600" />
                <span>Panel de Automatización SAVISER</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona las reglas de automatización del sistema
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Reglas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Reglas Activas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ejecutadas Hoy</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.executedToday}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reglas de Automatización
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Registro de Actividad
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getRuleIcon(rule.trigger)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <span className="font-medium">Disparador:</span>
                            <span className="capitalize">{rule.trigger}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="font-medium">Última ejecución:</span>
                            <span>{formatLastExecuted(rule.lastExecuted)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.isActive
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Rendimiento del Sistema</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tiempo de respuesta promedio:</span>
                      <span className="font-medium text-blue-900">0.3s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Reglas ejecutadas esta semana:</span>
                      <span className="font-medium text-blue-900">247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tasa de éxito:</span>
                      <span className="font-medium text-blue-900">99.2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Impacto en Eficiencia</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Tiempo ahorrado hoy:</span>
                      <span className="font-medium text-green-900">4.2 horas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Tareas automatizadas:</span>
                      <span className="font-medium text-green-900">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Errores evitados:</span>
                      <span className="font-medium text-green-900">23</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad por Tipo</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Recordatorios</p>
                    <p className="text-2xl font-bold text-blue-600">89</p>
                  </div>
                  <div className="text-center">
                    <Bell className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Alertas</p>
                    <p className="text-2xl font-bold text-yellow-600">34</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Asignaciones</p>
                    <p className="text-2xl font-bold text-green-600">67</p>
                  </div>
                  <div className="text-center">
                    <Stethoscope className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Seguimientos</p>
                    <p className="text-2xl font-bold text-purple-600">42</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Registro de Actividad Reciente</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {[
                    {
                      time: '10:30 AM',
                      action: 'Recordatorio de cita enviado',
                      details: 'Paciente: María González - Cita: 11:00 AM',
                      type: 'success'
                    },
                    {
                      time: '10:15 AM',
                      action: 'Triaje de alta prioridad detectado',
                      details: 'Paciente asignado automáticamente al Dr. Rodríguez',
                      type: 'warning'
                    },
                    {
                      time: '09:45 AM',
                      action: 'Carga de trabajo balanceada',
                      details: '3 pacientes redistribuidos entre doctores disponibles',
                      type: 'info'
                    },
                    {
                      time: '09:30 AM',
                      action: 'Seguimiento post-consulta programado',
                      details: 'Paciente: Carlos Mendoza - Seguimiento en 7 días',
                      type: 'success'
                    }
                  ].map((log, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          log.type === 'success' ? 'bg-green-500' :
                          log.type === 'warning' ? 'bg-yellow-500' :
                          log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{log.action}</h4>
                            <span className="text-xs text-gray-500">{log.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema de automatización funcionando correctamente</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationPanel;