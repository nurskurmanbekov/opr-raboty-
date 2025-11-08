import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, Activity, BarChart3, Settings, LogOut,
  MapPin, Bell, UserCog, Building2, Map, CheckSquare, TrendingUp, Zap, History, PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Главная', roles: ['all'] },
    { path: '/enhanced-dashboard', icon: Zap, label: 'Пульс системы', roles: ['superadmin', 'central_admin', 'auditor', 'mru_manager', 'district_manager'] },
    { path: '/clients', icon: Users, label: 'Клиенты', roles: ['all'] },
    { path: '/sessions', icon: Activity, label: 'Рабочие сессии', roles: ['all'] },
    { path: '/analytics', icon: BarChart3, label: 'Аналитика', roles: ['all'] },
    { path: '/statistics', icon: TrendingUp, label: 'Статистика', roles: ['superadmin', 'central_admin', 'auditor'] },
    { path: '/statistics-hub', icon: PieChart, label: 'Карта КР', roles: ['superadmin', 'central_admin', 'auditor', 'mru_manager', 'district_manager'] },
    { path: '/audit-log', icon: History, label: 'История действий', roles: ['superadmin', 'central_admin', 'auditor'] },
    { path: '/approvals', icon: CheckSquare, label: 'Заявки', roles: ['superadmin', 'central_admin'] },
    { path: '/mru', icon: Building2, label: 'МРУ', roles: ['superadmin', 'central_admin'] },
    { path: '/districts', icon: Map, label: 'Районы', roles: ['superadmin', 'central_admin'] },
    { path: '/geofences', icon: MapPin, label: 'Геозоны', roles: ['superadmin', 'regional_admin', 'district_admin'] },
    { path: '/notifications', icon: Bell, label: 'Уведомления', roles: ['all'] },
    { path: '/users', icon: UserCog, label: 'Пользователи', roles: ['superadmin', 'regional_admin', 'district_admin'] },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.roles.includes('all')) return true;
    return item.roles.includes(user?.role);
  });

  if (user?.role === 'superadmin' || user?.role === 'district_admin') {
    filteredMenuItems.push({ path: '/settings', icon: Settings, label: 'Настройки', roles: ['all'] });
  }

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Пробация КР</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.district || 'Все районы'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">{user?.fullName?.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition duration-200"
        >
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;