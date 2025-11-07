/**
 * App Navigator - Main Navigation Structure
 */

import React from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';
import ClientsListScreen from '../screens/ClientsListScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator (for authenticated users)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}>
      <Tab.Screen
        name="Main"
        component={MainScreen}
        options={{
          title: 'Главная',
          tabBarIcon: ({color}) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsListScreen}
        options={{
          title: 'Клиенты',
          tabBarIcon: ({color}) => <TabIcon icon="👥" color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Карта',
          tabBarIcon: ({color}) => <TabIcon icon="🗺️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({color}) => <TabIcon icon="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Tab Icon Component
const TabIcon = ({icon, color}) => {
  return (
    <Text style={{fontSize: 24, color: color, opacity: color === '#999' ? 0.5 : 1}}>
      {icon}
    </Text>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ActiveSession"
              component={ActiveSessionScreen}
              options={{
                headerShown: true,
                title: 'Активная смена',
                headerBackTitle: 'Назад',
                headerStyle: {
                  backgroundColor: '#007AFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
