/**
 * Clients List Screen - View Assigned Clients
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import {clientsAPI} from '../api/client';
import StorageService from '../services/storage';

const ClientsListScreen = ({navigation}) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        client =>
          client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getClients({
        assigned: true, // Get only assigned clients
      });
      const clientsList = response.data || response || [];
      setClients(clientsList);
      setFilteredClients(clientsList);

      // Cache for offline use
      await StorageService.setCachedClients(clientsList);
    } catch (error) {
      console.error('Error loading clients:', error);

      // Load from cache if offline
      const cachedClients = await StorageService.getCachedClients();
      if (cachedClients.length > 0) {
        setClients(cachedClients);
        setFilteredClients(cachedClients);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadClients();
    setIsRefreshing(false);
  };

  const renderClientItem = ({item}) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => navigation.navigate('ClientDetail', {clientId: item.id})}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.fullName}</Text>
        <Text style={styles.clientDetail}>
          📍 {item.address || 'Адрес не указан'}
        </Text>
        <Text style={styles.clientDetail}>
          📞 {item.phone || 'Телефон не указан'}
        </Text>
      </View>
      <View style={styles.clientBadge}>
        <Text style={styles.clientBadgeText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск клиентов..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          filteredClients.length === 0 && styles.emptyContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Клиенты не найдены'
                : 'Нет назначенных клиентов'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  clientItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  clientDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  clientBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientBadgeText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default ClientsListScreen;
