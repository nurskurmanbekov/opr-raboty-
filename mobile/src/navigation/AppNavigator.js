import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkSessionScreen from '../screens/WorkSessionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Главная',
            headerLeft: () => null,
            gestureEnabled: false
          }}
        />
        <Stack.Screen 
          name="WorkSession" 
          component={WorkSessionScreen}
          options={{ title: 'Рабочая сессия' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;