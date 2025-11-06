import { useState, useEffect } from 'react';
import { User, Lock, Save, Upload, Moon, Sun } from 'lucide-react';
import Layout from '../components/Layout';
import { profileAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

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
    try {
      setLoading(true);
      const response = await profileAPI.updateProfile(profileData);
      updateUser(response.data);
      alert('Профиль обновлен успешно');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }

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
      alert('Пароль изменен успешно');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Ошибка при изменении пароля. Проверьте текущий пароль.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('photo', file);
      const response = await profileAPI.uploadPhoto(formData);
      updateUser(response.data);
      alert('Фото профиля обновлено');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Ошибка при загрузке фото');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Профиль и настройки</h1>
        <p className="text-gray-600 mt-2">Управление вашим профилем и настройками</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white font-bold">
                    {user?.fullName?.charAt(0)}
                  </span>
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-3 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-100 transition"
                >
                  <Upload size={16} className="text-gray-600" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user?.fullName}</h2>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
              <div className="mt-4 space-y-2">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {user?.role}
                </div>
                {user?.district && (
                  <p className="text-sm text-gray-600">📍 {user.district}</p>
                )}
                {user?.employeeId && (
                  <p className="text-sm text-gray-600">ID: {user.employeeId}</p>
                )}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User size={20} />
                <span>Личные данные</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'password'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Lock size={20} />
                <span>Сменить пароль</span>
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'theme'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span>Тема оформления</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile}>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Личные данные</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Полное имя
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Район
                    </label>
                    <input
                      type="text"
                      value={profileData.district}
                      onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save size={20} />
                    <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword}>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Сменить пароль</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текущий пароль
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Подтвердите новый пароль
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Lock size={20} />
                    <span>{loading ? 'Изменение...' : 'Изменить пароль'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'theme' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Тема оформления</h3>
                <div className="space-y-4">
                  <div
                    onClick={() => handleThemeChange('light')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                        <Sun size={24} className="text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Светлая тема</h4>
                        <p className="text-sm text-gray-600">Классический белый фон</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => handleThemeChange('dark')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
                        <Moon size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Темная тема</h4>
                        <p className="text-sm text-gray-600">Темный фон, меньше нагрузки на глаза</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => handleThemeChange('auto')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      theme === 'auto'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-blue-900 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white text-xl">🌓</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Автоматически</h4>
                        <p className="text-sm text-gray-600">Следует системным настройкам</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
