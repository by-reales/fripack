import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native'; 
import * as NavigationBar from 'expo-navigation-bar'; 
import { useEffect } from 'react'; 

export default function TabLayout() {
  // Oculta la barra de navegación inferior cuando el componente se monta
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');

    // Restaura la visibilidad de la barra de navegación cuando el componente se desmonta
    return () => {
      NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  return (
    <>
      <StatusBar hidden /> 
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2ecc71', 
          tabBarInactiveTintColor: 'gray', 
          tabBarStyle: {
            backgroundColor: '#fff', // Fondo de la barra de pestañas
            borderTopWidth: 0, // Elimina el borde superior
            elevation: 5, // Sombra en Android
            shadowOpacity: 0.1, // Sombra en iOS
          },
          tabBarLabelStyle: {
            fontSize: 8, 
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name="map" 
                size={16} 
                color={focused ? '#2ecc71' : 'gray'} 
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Pronostico"
          options={{
            title: 'Pronóstico',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? 'cloud' : 'cloud-outline'} 
                size={16} 
                color={focused ? '#2ecc71' : 'gray'} 
              />
            ),

          }}
        />
      </Tabs>
    </>
  );
}