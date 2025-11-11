import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading('Вход в систему...');

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      toast.success('Вход выполнен успешно!', { id: loadingToast });
      // Небольшая задержка для показа success toast
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      toast.error(result.message || 'Ошибка входа', { id: loadingToast });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      }}
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
    >
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(144, 202, 249, 0.05)' : 'rgba(66, 165, 245, 0.1)'
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(244, 143, 177, 0.05)' : 'rgba(156, 39, 176, 0.1)'
          }}
        />
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
        />
      ))}

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? theme.colors.divider : 'transparent'
        }}
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield size={40} className="text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: isDark
                ? 'linear-gradient(to right, #90caf9, #f48fb1)'
                : 'linear-gradient(to right, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Система Пробации КР
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Мониторинг общественных работ
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: theme.colors.textSecondary }}
              />
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl transition"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.textPrimary,
                  border: `2px solid ${theme.colors.inputBorder}`,
                }}
                placeholder="admin@probation.kg"
                required
              />
            </div>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Пароль
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: theme.colors.textSecondary }}
              />
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl transition"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.textPrimary,
                  border: `2px solid ${theme.colors.inputBorder}`,
                }}
                placeholder="••••••"
                required
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Вход...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Войти</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Test Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 rounded-xl transition-colors"
          style={{
            background: isDark
              ? 'linear-gradient(to right, rgba(144, 202, 249, 0.1), rgba(244, 143, 177, 0.1))'
              : 'linear-gradient(to right, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
            border: `1px solid ${theme.colors.divider}`
          }}
        >
          <p
            className="text-center text-sm font-medium mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Тестовые данные:
          </p>
          <div className="space-y-1 text-xs" style={{ color: theme.colors.textSecondary }}>
            <div className="flex items-center justify-between">
              <span>Email:</span>
              <code
                className="px-2 py-1 rounded font-mono"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.primary
                }}
              >
                admin@probation.kg
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span>Пароль:</span>
              <code
                className="px-2 py-1 rounded font-mono"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.primary
                }}
              >
                123456
              </code>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
            © 2024 Система Пробации КР. Все права защищены.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
