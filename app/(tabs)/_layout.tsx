import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2ecc71', 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="map" size={24} color={focused ? '#2ecc71' : 'gray'} />
          ),
        }}
      />
    </Tabs>
  );
}
