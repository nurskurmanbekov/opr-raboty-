import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import api from '../api/axios';
import Button from '../components/Button';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Получаем статистику клиента
        const statsRes = await api.get(`/clients/${parsedUser.id}/stats`);
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  const progress = stats ? (stats.completedHours / stats.assignedHours * 100).toFixed(1) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.avatar }]}>
          <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
            {user?.fullName?.charAt(0)}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.textOnPrimary }]}>{user?.fullName}</Text>
        <Text style={[styles.district, { color: colors.textLight }]}>{user?.district}</Text>
      </View>

      {/* Progress Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Прогресс выполнения</Text>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {stats?.completedHours || 0} / {stats?.assignedHours || 0} часов
          </Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.progressBar }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.progressFill }]} />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.statBlue }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalSessions || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Всего сессий</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.statGreen }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.completedSessions || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Завершено</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Начать рабочую сессию"
          onPress={() => navigation.navigate('WorkSession')}
          style={styles.actionButton}
        />

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Выйти</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  district: {
    fontSize: 16,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;