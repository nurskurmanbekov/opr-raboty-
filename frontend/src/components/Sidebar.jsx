import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, Activity, BarChart3, Settings, LogOut,
  MapPin, Bell, UserCog, Building2, Map, CheckSquare, TrendingUp, Zap, History, PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();

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
    <div
      className="w-64 h-screen fixed left-0 top-0 flex flex-col transition-colors"
      style={{
        backgroundColor: isDark ? '#1a1a1a' : '#1f2937',
        color: theme.colors.textPrimary
      }}
    >
      <div
        className="p-6"
        style={{ borderBottom: `1px solid ${theme.colors.divider}` }}
      >
        <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
          Пробация КР
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
          {user?.district || 'Все районы'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
                color: isActive ? theme.colors.primaryContrast : theme.colors.textSecondary
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = theme.colors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className="p-4"
        style={{ borderTop: `1px solid ${theme.colors.divider}` }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <span className="text-lg font-bold" style={{ color: theme.colors.primaryContrast }}>
              {user?.fullName?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
              {user?.fullName}
            </p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
          style={{ color: theme.colors.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;