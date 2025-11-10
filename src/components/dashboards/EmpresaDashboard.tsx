import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Activity, UserPlus, Stethoscope, Building2, BarChart3, Clock, CheckCircle, AlertTriangle, FileText, Settings, Eye, CreditCard as Edit, Trash2, Plus, X } from 'lucide-react';
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

interface Especialidad {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

interface Consultorio {
  id: string;
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
  genero: 'M' | 'F';
  direccion?: string;
  email?: string;
  ultimaConsulta?: string;
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
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([
    { id: '1', nombre: 'Medicina General', descripcion: 'Atención médica general', activa: true },
    { id: '2', nombre: 'Cardiología', descripcion: 'Especialidad del corazón', activa: true },
    { id: '3', nombre: 'Pediatría', descripcion: 'Medicina infantil', activa: true },
    { id: '4', nombre: 'Ginecología', descripcion: 'Salud femenina', activa: true },
    { id: '5', nombre: 'Dermatología', descripcion: 'Enfermedades de la piel', activa: true }
  ]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([
    { id: '1', numero: '101', nombre: 'Consultorio Principal', ubicacion: 'Primer Piso', equipamiento: ['Camilla', 'Tensiómetro', 'Estetoscopio'], activo: true },
    { id: '2', numero: '102', nombre: 'Consultorio Cardiología', ubicacion: 'Primer Piso', equipamiento: ['ECG', 'Monitor Cardíaco'], activo: true },
    { id: '3', numero: '201', nombre: 'Consultorio Pediatría', ubicacion: 'Segundo Piso', equipamiento: ['Báscula Pediátrica', 'Tallímetro'], activo: true },
    { id: '4', numero: '202', nombre: 'Consultorio Ginecología', ubicacion: 'Segundo Piso', equipamiento: ['Mesa Ginecológica', 'Colposcopio'], activo: true }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctores' | 'nuevo-doctor' | 'reportes' | 'especialidades' | 'consultorios' | 'pacientes'>('dashboard');
  
  // Estados para modales y notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewDoctorModal, setShowNewDoctorModal] = useState(false);
  const [showEspecialidadModal, setShowEspecialidadModal] = useState(false);
  const [showConsultorioModal, setShowConsultorioModal] = useState(false);

  const [newDoctor, setNewDoctor] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    especialidad: '',
    numeroLicencia: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
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

  const [newEspecialidad, setNewEspecialidad] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  });

  const [newConsultorio, setNewConsultorio] = useState({
    numero: '',
    nombre: '',
    ubicacion: '',
    equipamiento: [''],
    activo: true
  });

  useEffect(() => {
    fetchStats();
    fetchDoctors();
    fetchPatients();
    
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
        // Datos simulados para demostración
        const mockPatients: Patient[] = [
          {
            _id: '1',
            nombre: 'María',
            apellido: 'González',
            cedula: '12345678',
            fechaNacimiento: '1985-05-15',
            telefono: '555-0123',
            genero: 'F',
            direccion: 'Calle 123 #45-67',
            email: 'maria.gonzalez@email.com',
            ultimaConsulta: new Date().toISOString()
          },
          {
            _id: '2',
            nombre: 'Carlos',
            apellido: 'Rodríguez',
            cedula: '87654321',
            fechaNacimiento: '1978-12-03',
            telefono: '555-0456',
            genero: 'M',
            direccion: 'Avenida 456 #78-90',
            email: 'carlos.rodriguez@email.com',
            ultimaConsulta: new Date(Date.now() - 86400000).toISOString()
          },
          {
            _id: '3',
            nombre: 'Ana',
            apellido: 'Martínez',
            cedula: '11223344',
            fechaNacimiento: '1990-08-20',
            telefono: '555-0789',
            genero: 'F',
            direccion: 'Carrera 789 #12-34',
            email: 'ana.martinez@email.com',
            ultimaConsulta: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        setPatients(mockPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)' };
    }
    return { valid: true, message: '' };
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (newDoctor.password !== newDoctor.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor, verifica que ambas sean iguales.');
      setShowErrorModal(true);
      return;
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePassword(newDoctor.password);
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.message);
      setShowErrorModal(true);
      return;
    }

    console.log('Submitting doctor data:', newDoctor);

    try {
      const token = localStorage.getItem('token');
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...doctorData } = newDoctor;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/doctors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(doctorData)
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
          confirmPassword: '',
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

  const handleCreateEspecialidad = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevaEspecialidad: Especialidad = {
      id: Date.now().toString(),
      ...newEspecialidad
    };
    
    setEspecialidades([...especialidades, nuevaEspecialidad]);
    setShowEspecialidadModal(false);
    setNewEspecialidad({
      nombre: '',
      descripcion: '',
      activa: true
    });
    
    setSuccessMessage('¡Especialidad agregada exitosamente!');
    setShowSuccessToast(true);
  };

  const handleCreateConsultorio = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevoConsultorio: Consultorio = {
      id: Date.now().toString(),
      ...newConsultorio,
      equipamiento: newConsultorio.equipamiento.filter(eq => eq.trim() !== '')
    };
    
    setConsultorios([...consultorios, nuevoConsultorio]);
    setShowConsultorioModal(false);
    setNewConsultorio({
      numero: '',
      nombre: '',
      ubicacion: '',
      equipamiento: [''],
      activo: true
    });
    
    setSuccessMessage('¡Consultorio agregado exitosamente!');
    setShowSuccessToast(true);
  };

  const updateHorario = (index: number, field: string, value: any) => {
    const updatedHorarios = [...newDoctor.horarios];
    updatedHorarios[index] = { ...updatedHorarios[index], [field]: value };
    setNewDoctor({ ...newDoctor, horarios: updatedHorarios });
  };

  const addEquipamiento = () => {
    setNewConsultorio({
      ...newConsultorio,
      equipamiento: [...newConsultorio.equipamiento, '']
    });
  };

  const removeEquipamiento = (index: number) => {
    const updatedEquipamiento = newConsultorio.equipamiento.filter((_, i) => i !== index);
    setNewConsultorio({
      ...newConsultorio,
      equipamiento: updatedEquipamiento
    });
  };

  const updateEquipamiento = (index: number, value: string) => {
    const updatedEquipamiento = [...newConsultorio.equipamiento];
    updatedEquipamiento[index] = value;
    setNewConsultorio({
      ...newConsultorio,
      equipamiento: updatedEquipamiento
    });
  };

  const toggleEspecialidad = (id: string) => {
    setEspecialidades(especialidades.map(esp => 
      esp.id === id ? { ...esp, activa: !esp.activa } : esp
    ));
  };

  const toggleConsultorio = (id: string) => {
    setConsultorios(consultorios.map(cons => 
      cons.id === id ? { ...cons, activo: !cons.activo } : cons
    ));
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
                Doctores
              </button>
              <button
                onClick={() => setActiveTab('especialidades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'especialidades'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Especialidades
              </button>
              <button
                onClick={() => setActiveTab('consultorios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consultorios'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Consultorios
              </button>
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pacientes'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pacientes
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

        {activeTab === 'especialidades' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Especialidades</h2>
                <button
                  onClick={() => setShowEspecialidadModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Especialidad</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {especialidades.map((especialidad) => (
                  <div key={especialidad.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{especialidad.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{especialidad.descripcion}</p>
                      </div>
                      <button
                        onClick={() => toggleEspecialidad(especialidad.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          especialidad.activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {especialidad.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultorios' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Consultorios</h2>
                <button
                  onClick={() => setShowConsultorioModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Consultorio</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consultorios.map((consultorio) => (
                  <div key={consultorio.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Consultorio {consultorio.numero}
                          </h3>
                          <p className="text-sm text-gray-600">{consultorio.nombre}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleConsultorio(consultorio.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          consultorio.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {consultorio.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📍</span>
                        <span>{consultorio.ubicacion}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Equipamiento:</span>
                        <ul className="mt-1 ml-4">
                          {consultorio.equipamiento.map((equipo, index) => (
                            <li key={index} className="text-xs">• {equipo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pacientes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pacientes Atendidos</h2>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cédula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Consulta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-600">
                                  {patient.nombre.charAt(0)}{patient.apellido.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {patient.nombre} {patient.apellido}
                              </div>
                              <div className="text-sm text-gray-500">
                                {patient.genero === 'M' ? 'Masculino' : 'Femenino'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.cedula}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {calculateAge(patient.fechaNacimiento)} años
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.telefono}</div>
                          <div className="text-sm text-gray-500">{patient.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.ultimaConsulta ? 
                            new Date(patient.ultimaConsulta).toLocaleDateString('es-ES') : 
                            'Sin consultas'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-purple-600 hover:text-purple-900">
                            Ver Historial
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {patients.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes registrados</h3>
                  <p className="text-gray-600">Los pacientes aparecerán aquí una vez que sean atendidos</p>
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
                    <select
                      required
                      value={newDoctor.especialidad}
                      onChange={(e) => setNewDoctor({...newDoctor, especialidad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar especialidad</option>
                      {especialidades.filter(esp => esp.activa).map((especialidad) => (
                        <option key={especialidad.id} value={especialidad.nombre}>
                          {especialidad.nombre}
                        </option>
                      ))}
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
                </div>
              </div>

              {/* Información de Acceso */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Acceso</h3>
                <div className="grid grid-cols-1 gap-4">
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
                      minLength={8}
                      value={newDoctor.password}
                      onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Debe contener: letra mayúscula, letra minúscula y un carácter especial
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newDoctor.confirmPassword}
                      onChange={(e) => setNewDoctor({...newDoctor, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Repita la contraseña"
                    />
                  </div>
                </div>
              </div>

              {/* Consultorio */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consultorio</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Consultorio *</label>
                    <select
                      required
                      value={`${newDoctor.consultorio.numero}|${newDoctor.consultorio.nombre}`}
                      onChange={(e) => {
                        const [numero, nombre] = e.target.value.split('|');
                        setNewDoctor({
                          ...newDoctor, 
                          consultorio: { numero, nombre }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar consultorio</option>
                      {consultorios.filter(cons => cons.activo).map((consultorio) => (
                        <option key={consultorio.id} value={`${consultorio.numero}|${consultorio.nombre}`}>
                          Consultorio {consultorio.numero} - {consultorio.nombre}
                        </option>
                      ))}
                    </select>
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

      {/* Nueva Especialidad Modal */}
      {showEspecialidadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Especialidad</h2>
            </div>
            
            <form onSubmit={handleCreateEspecialidad} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newEspecialidad.nombre}
                  onChange={(e) => setNewEspecialidad({...newEspecialidad, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                <textarea
                  required
                  rows={3}
                  value={newEspecialidad.descripcion}
                  onChange={(e) => setNewEspecialidad({...newEspecialidad, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEspecialidad.activa}
                  onChange={(e) => setNewEspecialidad({...newEspecialidad, activa: e.target.checked})}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Especialidad activa</span>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEspecialidadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Crear Especialidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nuevo Consultorio Modal */}
      {showConsultorioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Consultorio</h2>
            </div>
            
            <form onSubmit={handleCreateConsultorio} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                <input
                  type="text"
                  required
                  value={newConsultorio.numero}
                  onChange={(e) => setNewConsultorio({...newConsultorio, numero: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newConsultorio.nombre}
                  onChange={(e) => setNewConsultorio({...newConsultorio, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>
                <input
                  type="text"
                  required
                  value={newConsultorio.ubicacion}
                  onChange={(e) => setNewConsultorio({...newConsultorio, ubicacion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Equipamiento</label>
                  <button
                    type="button"
                    onClick={addEquipamiento}
                    className="bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {newConsultorio.equipamiento.map((equipo, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={equipo}
                        onChange={(e) => updateEquipamiento(index, e.target.value)}
                        placeholder="Nombre del equipo"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {newConsultorio.equipamiento.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEquipamiento(index)}
                          className="bg-red-100 text-red-700 px-2 py-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newConsultorio.activo}
                  onChange={(e) => setNewConsultorio({...newConsultorio, activo: e.target.checked})}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Consultorio activo</span>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConsultorioModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Crear Consultorio
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