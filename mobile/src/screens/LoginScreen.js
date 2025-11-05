import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import Button from '../components/Button';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email,
        password: password,
      });

      const { token, user } = response.data.data;
      
      // Проверяем что это клиент
      if (user.role !== 'client') {
        Alert.alert('Ошибка', 'Это приложение только для клиентов');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      navigation.replace('Home');
    } catch (error) {
      console.error('Login error:', error.response?.data);
      Alert.alert(
        'Ошибка входа',
        error.response?.data?.message || 'Неверный email или пароль'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Пробация КР</Text>
          <Text style={styles.subtitle}>Мобильное приложение для клиентов</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Войти"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.testData}>
            <Text style={styles.testDataTitle}>Тестовые данные:</Text>
            <Text style={styles.testDataText}>Email: alexey@example.com</Text>
            <Text style={styles.testDataText}>Пароль: 123456</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
  },
  testData: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  testDataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  testDataText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});

export default LoginScreen;