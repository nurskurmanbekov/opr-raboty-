import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Map } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import WorkSessionMap from '../components/WorkSessionMap';

const WorkSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/work-sessions');
      setSessions(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const handleVerify = async (sessionId, status) => {
    try {
      await api.put(`/work-sessions/${sessionId}/verify`, {
        status,
        verificationNotes: status === 'verified' ? 'Работа подтверждена' : 'Требуется повторная проверка'
      });
      fetchSessions();
    } catch (error) {
      console.error('Error verifying session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      in_progress: 'В процессе',
      completed: 'Завершена',
      verified: 'Верифицирована',
      rejected: 'Отклонена'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Рабочие сессии</h1>
        <p className="text-gray-600 mt-2">Мониторинг и верификация отработанных часов</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex space-x-2">
        {[
          { value: 'all', label: 'Все' },
          { value: 'completed', label: 'Ожидают проверки' },
          { value: 'verified', label: 'Верифицированные' },
          { value: 'in_progress', label: 'В процессе' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              filter === tab.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {session.client?.fullName}
                    </h3>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Дата</p>
                        <p className="text-sm font-medium">
                          {new Date(session.startTime).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Часы</p>
                        <p className="text-sm font-medium">{session.hoursWorked || 0} ч</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Место</p>
                        <p className="text-sm font-medium">{session.workLocation}</p>
                      </div>
                    </div>

                    {session.verifier && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle size={18} />
                        <div>
                          <p className="text-xs text-gray-500">Проверил</p>
                          <p className="text-sm font-medium">{session.verifier.fullName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {/* View on Map button - available for all sessions */}
                  <button
                    onClick={() => setSelectedSessionId(session.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
                  >
                    <Map size={18} />
                    <span>На карте</span>
                  </button>

                  {session.status === 'completed' && (
                    <>
                      <button
                        onClick={() => handleVerify(session.id, 'verified')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition"
                      >
                        <CheckCircle size={18} />
                        <span>Подтвердить</span>
                      </button>
                      <button
                        onClick={() => handleVerify(session.id, 'rejected')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition"
                      >
                        <XCircle size={18} />
                        <span>Отклонить</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Сессии не найдены
            </div>
          )}
        </div>
      )}

      {/* Map Modal */}
      {selectedSessionId && (
        <WorkSessionMap
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </Layout>
  );
};

export default WorkSessions;