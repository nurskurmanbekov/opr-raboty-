import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Clock, Activity, Map, Camera, Users, History } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import WorkSessionMap from '../components/WorkSessionMap';
import PhotoGallery from '../components/PhotoGallery';
import ClientReassignment from '../components/ClientReassignment';
import { reassignmentAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionForMap, setSelectedSessionForMap] = useState(null);
  const [selectedSessionForPhotos, setSelectedSessionForPhotos] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      const [clientRes, sessionsRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/work-sessions?clientId=${id}`)
      ]);
      setClient(clientRes.data.data);
      setSessions(sessionsRes.data.data);
      fetchAssignmentHistory();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching client data:', error);
      setLoading(false);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      const response = await reassignmentAPI.getAssignmentHistory(id);
      setAssignmentHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      // Don't show error to user, history is optional
    }
  };

  const handleReassignSuccess = () => {
    fetchClientData();
  };

  const canReassign = user?.role === 'central_admin' || user?.role === 'superadmin';

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

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Клиент не найден</p>
        </div>
      </Layout>
    );
  }

  const progress = (client.completedHours / client.assignedHours * 100).toFixed(1);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Назад к списку</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={40} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{client.fullName}</h1>
              <p className="text-gray-600 mt-1">ID: {client.idNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{progress}%</div>
            <p className="text-gray-600 mt-1">выполнено</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-800">Прогресс выполнения</span>
          <span className="text-lg font-semibold text-gray-800">
            {client.completedHours} / {client.assignedHours} часов
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Client Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Информация о клиенте</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{client.email || 'Не указан'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="text-gray-800">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Район</p>
                  <p className="text-gray-800">{client.district}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Дата начала</p>
                  <p className="text-gray-800">
                    {new Date(client.startDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <User size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Куратор</p>
                  <p className="text-gray-800">{client.officer?.fullName}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Activity size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Статус</p>
                  <p className="text-gray-800 capitalize">{client.status}</p>
                </div>
              </div>
            </div>
            {client.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Примечания</p>
                <p className="text-gray-800">{client.notes}</p>
              </div>
            )}

            {/* Reassignment and History Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              {canReassign && (
                <button
                  onClick={() => setShowReassignModal(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                >
                  <Users size={18} />
                  <span>Переназначить клиента</span>
                </button>
              )}
              {assignmentHistory.length > 0 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                >
                  <History size={18} />
                  <span>История назначений ({assignmentHistory.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sessions History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              История рабочих сессий ({sessions.length})
            </h3>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Рабочих сессий пока нет</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(session.startTime).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(session.startTime).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {session.endTime && (
                            <> - {new Date(session.endTime).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Часы: </span>
                        <span className="font-medium text-gray-800">
                          {session.hoursWorked || 0} ч
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Место: </span>
                        <span className="font-medium text-gray-800">
                          {session.workLocation}
                        </span>
                      </div>
                      {session.verifier && (
                        <>
                          <div>
                            <span className="text-gray-500">Проверил: </span>
                            <span className="font-medium text-gray-800">
                              {session.verifier.fullName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Дата проверки: </span>
                            <span className="font-medium text-gray-800">
                              {new Date(session.verifiedAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {session.verificationNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{session.verificationNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => setSelectedSessionForMap(session.id)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition"
                      >
                        <Map size={18} />
                        <span>Карта</span>
                      </button>
                      <button
                        onClick={() => setSelectedSessionForPhotos(session)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-700 transition"
                      >
                        <Camera size={18} />
                        <span>Фото ({session.photos?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {selectedSessionForMap && (
        <WorkSessionMap
          sessionId={selectedSessionForMap}
          onClose={() => setSelectedSessionForMap(null)}
        />
      )}

      {/* Photo Gallery Modal */}
      {selectedSessionForPhotos && (
        <PhotoGallery
          photos={selectedSessionForPhotos.photos || []}
          onClose={() => setSelectedSessionForPhotos(null)}
          sessionInfo={{
            clientName: client.fullName,
            date: selectedSessionForPhotos.startTime
          }}
        />
      )}

      {/* Reassignment Modal */}
      {showReassignModal && (
        <ClientReassignment
          client={client}
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          onSuccess={handleReassignSuccess}
        />
      )}

      {/* Assignment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <History className="text-gray-600" size={24} />
                  <h2 className="text-2xl font-bold text-gray-800">
                    История назначений
                  </h2>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Клиент: <span className="font-medium">{client.fullName}</span>
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {assignmentHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  История назначений пуста
                </p>
              ) : (
                <div className="space-y-4">
                  {assignmentHistory.map((record, index) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            #{assignmentHistory.length - index}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Previous Assignment */}
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-xs text-red-600 font-medium mb-2">Предыдущее назначение</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Офицер:</span> {record.previousOfficerName || 'Не назначен'}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Район:</span> {record.previousDistrictName || 'Не указан'}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">МРУ:</span> {record.previousMruName || 'Не указано'}
                            </p>
                          </div>
                        </div>

                        {/* New Assignment */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs text-green-600 font-medium mb-2">Новое назначение</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Офицер:</span> {record.newOfficerName}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Район:</span> {record.newDistrictName || 'Не указан'}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">МРУ:</span> {record.newMruName || 'Не указано'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {record.reason && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Причина:</p>
                          <p className="text-sm text-gray-700">{record.reason}</p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Переназначено: <span className="font-medium text-gray-700">{record.reassignedByName}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientDetail;