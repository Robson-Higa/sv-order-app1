import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { UserType, RootStackParamList, MainTabParamList } from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ServiceOrdersScreen from '../screens/ServiceOrdersScreen';
import ServiceOrderDetailsScreen from '../screens/ServiceOrderDetailsScreen';
import CreateServiceOrderScreen from '../screens/CreateServiceOrderScreen';
import UsersScreen from '../screens/UsersScreen';
import EstablishmentsScreen from '../screens/EstablishmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'ServiceOrders':
              iconName = 'assignment';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Establishments':
              iconName = 'business';
              break;
            case 'Reports':
              iconName = 'assessment';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="ServiceOrders" 
        component={ServiceOrdersScreen}
        options={{ title: 'Ordens de Serviço' }}
      />
      
      {user?.userType === UserType.ADMIN && (
        <>
          <Tab.Screen 
            name="Users" 
            component={UsersScreen}
            options={{ title: 'Usuários' }}
          />
          <Tab.Screen 
            name="Establishments" 
            component={EstablishmentsScreen}
            options={{ title: 'Estabelecimentos' }}
          />
          <Tab.Screen 
            name="Reports" 
            component={ReportsScreen}
            options={{ title: 'Relatórios' }}
          />
        </>
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuário autenticado
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="ServiceOrderDetails" 
              component={ServiceOrderDetailsScreen}
              options={{ 
                headerShown: true,
                title: 'Detalhes da Ordem'
              }}
            />
            <Stack.Screen 
              name="CreateServiceOrder" 
              component={CreateServiceOrderScreen}
              options={{ 
                headerShown: true,
                title: 'Nova Ordem de Serviço'
              }}
            />
            <Stack.Screen 
              name="EditServiceOrder" 
              component={CreateServiceOrderScreen}
              options={{ 
                headerShown: true,
                title: 'Editar Ordem de Serviço'
              }}
            />
          </>
        ) : (
          // Usuário não autenticado
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ 
                headerShown: true,
                title: 'Criar Conta'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

