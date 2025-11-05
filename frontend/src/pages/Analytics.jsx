import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Award } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';

const Analytics = () => {
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, sessionsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/work-sessions')
      ]);
      setClients(clientsRes.data.data);
      setSessions(sessionsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Статистика по статусам клиентов
  const clientStatusData = [
    { name: 'Активные', value: clients.filter(c => c.status === 'active').length, color: '#10b981' },
    { name: 'Завершенные', value: clients.filter(c => c.status === 'completed').length, color: '#3b82f6' },
    { name: 'Приостановленные', value: clients.filter(c => c.status === 'suspended').length, color: '#f59e0b' },
    { name: 'Нарушения', value: clients.filter(c => c.status === 'violated').length, color: '#ef4444' }
  ];

  // Топ 5 клиентов по прогрессу
  const topClients = clients
    .map(c => ({
      name: c.fullName,
      progress: (c.completedHours / c.assignedHours * 100).toFixed(1),
      hours: c.completedHours
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // Статистика по сессиям за последние 7 дней
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });

    last7Days.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      sessions: daySessions.length,
      hours: daySessions.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0).toFixed(2)
    });
  }

  // Статистика по районам
  const districtStats = {};
  clients.forEach(client => {
    if (!districtStats[client.district]) {
      districtStats[client.district] = {
        district: client.district,
        clients: 0,
        totalHours: 0,
        completedHours: 0
      };
    }
    districtStats[client.district].clients++;
    districtStats[client.district].totalHours += client.assignedHours;
    districtStats[client.district].completedHours += client.completedHours;
  });

  const districtData = Object.values(districtStats).map(d => ({
    ...d,
    progress: ((d.completedHours / d.totalHours) * 100).toFixed(1)
  }));

  // Статистика карточек
  const stats = [
    {
      title: 'Всего часов выполнено',
      value: sessions.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0).toFixed(1),
      icon: Clock,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Активных клиентов',
      value: clients.filter(c => c.status === 'active').length,
      icon: Users,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Средний прогресс',
      value: (clients.reduce((sum, c) => sum + (c.completedHours / c.assignedHours * 100), 0) / clients.length || 0).toFixed(1) + '%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'Верифицированных сессий',
      value: sessions.filter(s => s.status === 'verified').length,
      icon: Award,
      color: 'bg-orange-500',
      change: '+15%'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Аналитика и статистика</h1>
        <p className="text-gray-600 mt-2">Визуализация данных и отчеты</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
              </div>
              <p className="text-gray-600 text-sm">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sessions Over Time */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Рабочие сессии за последние 7 дней</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sessions" stroke="#3b82f6" name="Сессии" strokeWidth={2} />
              <Line type="monotone" dataKey="hours" stroke="#10b981" name="Часы" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Client Status Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Распределение клиентов по статусам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {clientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* District Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика по районам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="clients" fill="#3b82f6" name="Клиенты" />
              <Bar dataKey="completedHours" fill="#10b981" name="Выполнено часов" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Топ 5 клиентов по прогрессу</h3>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.hours} часов</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(client.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{client.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;