import { useState, useEffect } from 'react';
import { User, Lock, Save, Upload, Moon, Sun, Mail, Phone, MapPin, Badge, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { profileAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  superadmin: 'from-red-500 to-red-600',
  regional_admin: 'from-purple-500 to-purple-600',
  district_admin: 'from-blue-500 to-blue-600',
  officer: 'from-green-500 to-green-600',
  supervisor: 'from-yellow-500 to-yellow-600',
  analyst: 'from-indigo-500 to-indigo-600',
  observer: 'from-gray-500 to-gray-600',
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'theme'
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    district: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        district: user.district || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Обновление профиля...');
    try {
      setLoading(true);
      const response = await profileAPI.updateProfile(profileData);
      updateUser(response.data);
      toast.success('Профиль обновлен успешно', { id: loadingToast });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка при обновлении профиля', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    const loadingToast = toast.loading('Изменение пароля...');
    try {
      setLoading(true);
      await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Пароль изменен успешно', { id: loadingToast });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Ошибка при изменении пароля. Проверьте текущий пароль.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading('Загрузка фото...');
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('photo', file);
      const response = await profileAPI.uploadPhoto(formData);
      updateUser(response.data);
      toast.success('Фото профиля обновлено', { id: loadingToast });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Ошибка при загрузке фото', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(`Тема изменена на ${newTheme === 'light' ? 'светлую' : newTheme === 'dark' ? 'темную' : 'автоматическую'}`);
  };

  const getRoleColor = (role) => {
    return ROLE_COLORS[role] || ROLE_COLORS.observer;
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Профиль и настройки
        </h1>
        <p className="text-gray-600 mt-2">Управление вашим профилем и настройками</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - User Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className={`w-28 h-28 bg-gradient-to-br ${getRoleColor(user?.role)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                >
                  <span className="text-5xl text-white font-bold">
                    {user?.fullName?.charAt(0)}
                  </span>
                </motion.div>
                <motion.label
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  htmlFor="photo-upload"
                  className="absolute bottom-3 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-50 transition border-2 border-blue-100"
                >
                  <Camera size={18} className="text-blue-600" />
                </motion.label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-800"
              >
                {user?.fullName}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 text-sm mt-1"
              >
                {user?.email}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 space-y-3"
              >
                <div className={`inline-block px-4 py-2 bg-gradient-to-r ${getRoleColor(user?.role)} text-white text-xs font-medium rounded-full shadow-md`}>
                  {user?.role}
                </div>

                {user?.district && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{user.district}</span>
                  </div>
                )}

                {user?.employeeId && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Badge size={16} className="text-gray-400" />
                    <span>ID: {user.employeeId}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-8 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User size={20} />
                <span className="font-medium">Личные данные</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'password'
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Lock size={20} />
                <span className="font-medium">Сменить пароль</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('theme')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'theme'
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="font-medium">Тема оформления</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-md p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleUpdateProfile}
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                    Личные данные
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Полное имя
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Район
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={profileData.district}
                          onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 w-full"
                    >
                      <Save size={20} />
                      <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {activeTab === 'password' && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleChangePassword}
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                    Сменить пароль
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Текущий пароль
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Новый пароль
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          required
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Подтвердите новый пароль
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          required
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 w-full"
                    >
                      <Lock size={20} />
                      <span>{loading ? 'Изменение...' : 'Изменить пароль'}</span>
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {activeTab === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                    Тема оформления
                  </h3>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleThemeChange('light')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                          <Sun size={28} className="text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">Светлая тема</h4>
                          <p className="text-sm text-gray-600">Классический белый фон</p>
                        </div>
                        {theme === 'light' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleThemeChange('dark')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                          <Moon size={28} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">Темная тема</h4>
                          <p className="text-sm text-gray-600">Темный фон, меньше нагрузки на глаза</p>
                        </div>
                        {theme === 'dark' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleThemeChange('auto')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition ${
                        theme === 'auto'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-3xl">🌓</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">Автоматически</h4>
                          <p className="text-sm text-gray-600">Следует системным настройкам</p>
                        </div>
                        {theme === 'auto' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
