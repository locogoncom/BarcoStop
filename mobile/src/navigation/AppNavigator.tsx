import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {ActivityIndicator, View, Text} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import AuthScreen from '../screens/AuthScreen';
import BookingsScreen from '../screens/BookingsScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import TripListScreen from '../screens/TripListScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import PatronRequestsScreen from '../screens/PatronRequestsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import {GlobalShareButton} from '../components/GlobalShareButton';

export type RootStackParamList = {
  Home: undefined;
  Auth: {role: 'patron' | 'viajero'};
  MainApp: undefined;
};

export type MainTabParamList = {
  Trips: undefined;
  Bookings: undefined;
  Favorites: undefined;
  Messages: undefined;
  Chat: {conversationId: string; otherUserName: string; otherUserId: string};
  Profile: undefined;
  Reservations: undefined;
  PatronRequests: undefined;
  TripDetail: {tripId: string};
  CreateTrip: {patronId: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const TripStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();

function TripListStack({navigation}: any) {
  const {t} = useLanguage();
  return (
    <TripStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0284c7'},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '700'},
      }}>
      <TripStack.Screen
        name="TripListScreen"
        component={TripListScreen}
        options={{title: t('navTrips')}}
      />
      <TripStack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{title: t('navTripDetail')}}
      />
      <TripStack.Screen
        name="CreateTrip"
        component={CreateTripScreen}
        options={{title: t('navCreateTrip')}}
      />
    </TripStack.Navigator>
  );
}

function ProfileStack_({navigation}: any) {
  const {t} = useLanguage();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0284c7'},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '700'},
      }}>
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{title: t('navProfile')}}
      />
    </ProfileStack.Navigator>
  );
}

function MessagesStack_({navigation}: any) {
  const {t} = useLanguage();
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0284c7'},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '700'},
      }}>
      <MessagesStack.Screen
        name="MessagesList"
        component={MessagesScreen}
        options={{title: t('navMessages') || '💬 Mensajes'}}
      />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
          headerBackTitle: 'Atrás',
        }}
      />
    </MessagesStack.Navigator>
  );
}

function MainAppTabs() {
  const {t} = useLanguage();
  const {session} = useAuth();

  // Para viajeros: Viajes y Mis Reservas
  if (session?.role === 'viajero') {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0284c7',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e2e8f0',
            borderTopWidth: 1,
            paddingVertical: 4,
            height: 60,
          },
        }}>
        <Tab.Screen
          name="Trips"
          component={TripListStack}
          options={{
            tabBarLabel: ({focused}: {focused: boolean}) => (
              <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
                🔍 Buscar
              </Text>
            ),
            tabBarIcon: () => <Text style={{fontSize: 22}}>🔍</Text>,
          }}
        />
        <Tab.Screen
          name="Reservations"
          component={ReservationsScreen}
          options={{
            tabBarLabel: ({focused}: {focused: boolean}) => (
              <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
                📋 Mis Reservas
              </Text>
            ),
            tabBarIcon: () => <Text style={{fontSize: 22}}>📋</Text>,
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesStack_}
          options={{
            tabBarLabel: ({focused}: {focused: boolean}) => (
              <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
                💬 Mensajes
              </Text>
            ),
            tabBarIcon: () => <Text style={{fontSize: 22}}>💬</Text>,
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            tabBarLabel: ({focused}: {focused: boolean}) => (
              <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
                ❤️ Favoritos
              </Text>
            ),
            tabBarIcon: () => <Text style={{fontSize: 22}}>❤️</Text>,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack_}
          options={{
            tabBarLabel: ({focused}: {focused: boolean}) => (
              <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
                👤 Perfil
              </Text>
            ),
            tabBarIcon: () => <Text style={{fontSize: 22}}>👤</Text>,
          }}
        />
      </Tab.Navigator>
    );
  }

  // Para patrones: Mis Viajes, Solicitudes, Barcos, etc.
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          paddingVertical: 4,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Trips"
        component={TripListStack}
        options={{
          tabBarLabel: ({focused}: {focused: boolean}) => (
            <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
              🚢 Mis Viajes
            </Text>
          ),
          tabBarIcon: () => <Text style={{fontSize: 22}}>🚢</Text>,
        }}
      />
      <Tab.Screen
        name="PatronRequests"
        component={PatronRequestsScreen}
        options={{
          tabBarLabel: ({focused}: {focused: boolean}) => (
            <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
              📬 Solicitudes
            </Text>
          ),
          tabBarIcon: () => <Text style={{fontSize: 22}}>📬</Text>,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack_}
        options={{
          tabBarLabel: ({focused}: {focused: boolean}) => (
            <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
              💬 Mensajes
            </Text>
          ),
          tabBarIcon: () => <Text style={{fontSize: 22}}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: ({focused}: {focused: boolean}) => (
            <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
              ❤️ Favoritos
            </Text>
          ),
          tabBarIcon: () => <Text style={{fontSize: 22}}>❤️</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack_}
        options={{
          tabBarLabel: ({focused}: {focused: boolean}) => (
            <Text style={{fontSize: 11, color: focused ? '#0284c7' : '#94a3b8', marginTop: 4}}>
              👤 Perfil
            </Text>
          ),
          tabBarIcon: () => <Text style={{fontSize: 22}}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const {session, isLoading} = useAuth();
  const {t} = useLanguage();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={{flex: 1}}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {backgroundColor: '#0284c7'},
            headerTintColor: '#fff',
            headerTitleStyle: {fontWeight: '700'},
          }}
          initialRouteName={session ? 'MainApp' : 'Home'}>
          <Stack.Screen name="Home" component={HomeScreen} options={{title: 'BarcoStop'}} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              title: t('navAccess'),
            }}
          />
          <Stack.Screen
            name="MainApp"
            component={MainAppTabs}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
        <GlobalShareButton />
      </View>
    </NavigationContainer>
  );
}
