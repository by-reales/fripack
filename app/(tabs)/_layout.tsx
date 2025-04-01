import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, View, StyleSheet } from 'react-native'; 
import * as NavigationBar from 'expo-navigation-bar'; 
import { useEffect } from 'react'; 

export default function TabLayout() {
  // Oculta la barra de navegación inferior
  useEffect(() => {
    const hideNavigationBar = async () => {
      await NavigationBar.setVisibilityAsync('hidden');
    };
    hideNavigationBar();

    return () => {
      const showNavigationBar = async () => {
        await NavigationBar.setVisibilityAsync('visible');
      };
      showNavigationBar();
    };
  }, []);

  const TabBarIcon = ({ focused, name, activeName }: { 
    focused: boolean; 
    name: keyof typeof Ionicons.glyphMap; 
    activeName?: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.activeIconWrapper
      ]}>
        <Ionicons 
          name={focused && activeName ? activeName : name} 
          size={focused ?  24 : 20} 
          color={focused ? '#2ecc71' : 'gray'} 
          style={focused ? styles.activeIcon : styles.inactiveIcon}
        />
      </View>
    </View>
  );

  return (
    <>
     <StatusBar hidden /> 
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2ecc71',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >


        <Tabs.Screen
          name="Pronostico"
          options={{
            title: 'Pronóstico',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused}
                name="cloud-outline"
                activeName="cloud"
              />
            ),
          }}
        />

<Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused}
                name="map-outline"
                activeName="map"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Recomendaciones"
          options={{
            title: 'Recomendaciones',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused}
                name="alert-circle-outline"
                activeName="alert-circle"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 5,
    shadowOpacity: 0.1,
    height: 60,
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarLabel: {
    fontSize: 10,
    marginBottom: 5,
    fontWeight: '500',
  },
  iconContainer: {
    width: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  
  
    paddingTop: 40,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  activeIcon: {
    position: 'absolute',
    bottom: 10,
    transform: [{ scale: 1.2 }],
  },
  inactiveIcon: {
    position: 'absolute',
    bottom: 8,
  },
});