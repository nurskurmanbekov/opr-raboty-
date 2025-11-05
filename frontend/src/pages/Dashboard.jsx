import { useState, useEffect } from 'react';
import { Users, Activity, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    completedSessions: 0,
    pendingSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const clientsRes = await api.get('/clients');
      const sessionsRes = await api.get('/work-sessions');
      
      const clients = clientsRes.data.data;
      const sessions = sessionsRes.data.data;

      setStats({
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        completedSessions: sessions.filter(s => s.status === 'verified').length,
        pendingSessions: sessions.filter(s => s.status === 'completed').length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Всего клиентов',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Активные клиенты',
      value: stats.activeClients,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Верифицированные сессии',
      value: stats.completedSessions,
      icon: CheckCircle,
      color: 'bg-purple-500'
    },
    {
      title: 'Ожидают проверки',
      value: stats.pendingSessions,
      icon: Clock,
      color: 'bg-orange-500'
    }
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Панель управления</h1>
        <p className="text-gray-600 mt-2">Добро пожаловать в систему мониторинга</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;