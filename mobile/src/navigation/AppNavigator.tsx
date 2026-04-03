import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useState} from 'react';
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
import {ShareTabModal} from '../components/ShareTabModal';
import {colors} from '../theme/colors';

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
  Share: undefined;
  Chat: {conversationId?: string; otherUserName: string; otherUserId: string; tripId?: string};
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

function SharePlaceholderScreen() {
  return null;
}

const tabBarBaseScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSubtle,
  tabBarShowIcon: true,
  tabBarLabelPosition: 'below-icon' as const,
  tabBarLabelStyle: {fontSize: 11, marginTop: 4},
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 4,
    height: 60,
  },
};

const makeTabOptions = (label: string, icon: string) => ({
  tabBarLabel: label,
  tabBarIcon: () => <Text style={{fontSize: 22}}>{icon}</Text>,
});

function TripListStack({navigation}: any) {
  const {t} = useLanguage();
  return (
    <TripStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: colors.white,
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
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: colors.white,
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
        headerStyle: {backgroundColor: colors.primary},
        headerTintColor: colors.white,
        headerTitleStyle: {fontWeight: '700'},
      }}>
      <MessagesStack.Screen
        name="MessagesList"
        component={MessagesScreen}
        options={{title: t('navMessages') || 'Mensajes'}}
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
  const {session} = useAuth();
  const [shareVisible, setShareVisible] = useState(false);

  const shareTabOptions = makeTabOptions('Compartir', '📤');
  const shareTabListeners = {
    tabPress: (event: any) => {
      event.preventDefault();
      setShareVisible(true);
    },
  };

  if (session?.role === 'viajero') {
    return (
      <>
        <Tab.Navigator
          screenOptions={tabBarBaseScreenOptions}>
          <Tab.Screen
            name="Trips"
            component={TripListStack}
            options={makeTabOptions('Buscar', '🔍')}
          />
          <Tab.Screen
            name="Reservations"
            component={ReservationsScreen}
            options={makeTabOptions('Reservas', '📋')}
          />
          <Tab.Screen
            name="Messages"
            component={MessagesStack_}
            options={makeTabOptions('Mensajes', '💬')}
          />
          <Tab.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={makeTabOptions('Favoritos', '❤️')}
          />
          <Tab.Screen
            name="Share"
            component={SharePlaceholderScreen}
            options={shareTabOptions}
            listeners={shareTabListeners}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStack_}
            options={makeTabOptions('Perfil', '👤')}
          />
        </Tab.Navigator>
        <ShareTabModal visible={shareVisible} onClose={() => setShareVisible(false)} />
      </>
    );
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={tabBarBaseScreenOptions}>
        <Tab.Screen
          name="Trips"
          component={TripListStack}
          options={makeTabOptions('Viajes', '🚢')}
        />
        <Tab.Screen
          name="PatronRequests"
          component={PatronRequestsScreen}
          options={makeTabOptions('Solicitudes', '📬')}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesStack_}
          options={makeTabOptions('Mensajes', '💬')}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={makeTabOptions('Favoritos', '❤️')}
        />
        <Tab.Screen
          name="Share"
          component={SharePlaceholderScreen}
          options={shareTabOptions}
          listeners={shareTabListeners}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack_}
          options={makeTabOptions('Perfil', '👤')}
        />
      </Tab.Navigator>
      <ShareTabModal visible={shareVisible} onClose={() => setShareVisible(false)} />
    </>
  );
}

export default function AppNavigator() {
  const {session, isLoading} = useAuth();
  const {t} = useLanguage();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.primary},
          headerTintColor: colors.white,
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
    </NavigationContainer>
  );
}
