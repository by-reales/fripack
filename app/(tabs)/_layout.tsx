import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2ecc71', // Color activo de las pestañas
        tabBarInactiveTintColor: 'gray', // Color inactivo de las pestañas
        tabBarStyle: {
          backgroundColor: '#fff', // Fondo de la barra de pestañas
          borderTopWidth: 0, // Elimina el borde superior
          elevation: 5, // Sombra en Android
          shadowOpacity: 0.1, // Sombra en iOS
        },
      }}
    >
      {/* Pestaña del Mapa */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name="map" 
              size={24} 
              color={focused ? '#2ecc71' : 'gray'} 
            />
          ),
        }}
      />

      {/* Pestaña del Pronóstico del Tiempo */}
      <Tabs.Screen
        name="Pronostico"
        options={{
          title: 'Pronóstico',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? 'cloud' : 'cloud-outline'} 
              size={24} 
              color={focused ? '#2ecc71' : 'gray'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}