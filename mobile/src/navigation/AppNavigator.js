import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#7e22ce', tabBarInactiveTintColor: '#aaa', headerShown: false }}>
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>, tabBarLabel: 'Classes' }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎟</Text>, tabBarLabel: 'My Bookings' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>, tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={StudentTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
