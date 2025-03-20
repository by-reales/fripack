import React, { ReactNode } from 'react';
import { Animated, Dimensions, TouchableOpacity, View, Text, StyleSheet, Modal, TextInput, ScrollView, Alert, Linking, Pressable, FlatList,  PanResponder } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import * as ExpoLocation from 'expo-location';
import CustomMarker, { LocationKey, Location } from '../../assets/markers';
import { useEffect, useRef, useState } from "react";
import Config from 'react-native-config'; // seguridad de la API
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'; // Responsividad

const UV_API_KEY = Config.UV_API_KEY;



const API_KEY = '01d1e2a2ab57d9ea74d3d44680b5d8d7';
const { height, width } = Dimensions.get('window');


interface AnimatedTouchableItemProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

const AnimatedTouchableItem: React.FC<AnimatedTouchableItemProps> = ({ children, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 1.1, // Escala ligeramente el elemento hacia adentro
      useNativeDriver: true,
      speed: 50,
      bounciness: 30, // Añade rebote
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, // Vuelve a la escala normal
      useNativeDriver: true,
      speed: 50,
      bounciness: 10, // Añade rebote
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.infoCard, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
const locations: Record<LocationKey, Location> = {
  H1: { latitude: 10.994262, longitude:-74.792331 },
  H2: { latitude: 10.995134, longitude: -74.792289 },
  H3: { latitude: 10.995129, longitude: -74.792534 },
  H4: { latitude: 10.996640, longitude: -74.796771 },
  H6: { latitude: 10.995328, longitude: -74.796315 },
  H7: { latitude: 10.995346, longitude: -74.791502 },
};

const sedeNames: Record<LocationKey, string> = {
  H1: 'Sede 1',
  H2: 'Sede 2',
  H3: 'Sede 3',
  H4: 'Sede Postgrados',
  H6: 'Sede 6 Eureka',
  H7: 'Casa Blanca',
};

const sedeAddresses: Record<LocationKey, string> = {
  H1: 'Headquarter H1',
  H2: 'Headquarter H2',
  H3: 'Headquarter H3',
  H4: 'Headquarter H4',
  H6: 'Headquarter H6',
  H7: 'Headquarter H7',
};

// Mapa minimalista con estilo claro
const mapStyle = [
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

// Componente SedeItem
const SedeItem = ({ 
  sede, 
  onSelect, 
  selectionType 
}: { 
  sede: LocationKey, 
  onSelect: (sede: LocationKey) => void, 
  selectionType: 'origin' | 'destination' 
}) => {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={`${sedeNames[sede]}. ${sedeAddresses[sede]}. Seleccionar como ${selectionType === 'origin' ? 'punto de partida' : 'destino'}`}
      accessibilityRole="button"
      accessibilityHint={`Toca para seleccionar ${sedeNames[sede]} como ${selectionType === 'origin' ? 'punto de partida' : 'destino'}`}
      style={styles.sedeItem} 
      onPress={() => onSelect(sede)}
    >
      <View style={styles.sedeIconContainer}>
        <Ionicons 
          name="location" 
          size={24} 
          color="#2ecc71" 
          accessible={false} // Evita que el ícono sea leído por el lector de pantalla
        />
      </View>
      <View style={styles.sedeInfoContainer}>
        <Text 
          style={styles.sedeName}
          accessible={true}
          accessibilityLabel={`Nombre: ${sedeNames[sede]}`}
        >
          {sedeNames[sede]}
        </Text>
        <Text 
          style={styles.sedeAddress}
          accessible={true}
          accessibilityLabel={`Dirección: ${sedeAddresses[sede]}`}
        >
          {sedeAddresses[sede]}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Calcular distancia directa entre dos puntos
const calculateDirectDistance = (point1: Location, point2: Location): number => {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c); // Distancia en metros
};

export default function MapScreen() {
  const [originSede, setOriginSede] = useState<LocationKey | ''>('');
  const [destinationSede, setDestinationSede] = useState<LocationKey | ''>('');
  const [route, setRoute] = useState<Location[]>([]);
  const [animatedRoute, setAnimatedRoute] = useState<Location[]>([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null); // <- Añadir esto
  const [weather, setWeather] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'origin' | 'destination'>('origin');
  const [sedeSearch, setSedeSearch] = useState('');
  const [routeDetails, setRouteDetails] = useState(false);
  const panelHeight = useRef(new Animated.Value(140)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [feelsLike, setFeelsLike] = useState<number | null>(null); 
  const [uvIndex, setUvIndex] = useState<number | null>(null); 
  const [selectedGridItem, setSelectedGridItem] = useState<{row: number; col: number} | null>(null);
  const currentHeightRef = useRef(140);

  useEffect(() => {
    const listenerId = panelHeight.addListener(({ value }) => {
      currentHeightRef.current = value;
    });
    return () => panelHeight.removeListener(listenerId);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        const newHeight = currentHeightRef.current - gestureState.dy;
        const clampedHeight = Math.max(0, Math.min(350, newHeight));
        panelHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (e, gestureState) => {
        const currentHeight = currentHeightRef.current;
        const velocity = gestureState.vy;
  
        let targetHeight;
        if (velocity > 0.5) { 
          targetHeight = 0;
        } else if (velocity < -0.5) { 
          targetHeight = 350;
        } else {
          targetHeight = currentHeight > (350 + 10) / 2 ? 350 : 0;
        }
  
        Animated.spring(panelHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          speed: 50,
          bounciness: 0,
        }).start();
      },
    })
  ).current;

  const fetchUVIndex = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=1eb5ae58653e491cbeb192832251203&q=${lat},${lon}`
      );
      setUvIndex(response.data.current.uv); // Extrae el índice UV
    } catch (error) {
      console.error('Error obteniendo el índice UV', error);
    }
  };


  const getUVDescription = (uvIndex: number | null): string => {
    if (uvIndex === null) return '--';
    if (uvIndex <= 2) return 'Bajo';
    if (uvIndex <= 5) return 'Moderado';
    if (uvIndex <= 7) return 'Alto';
    if (uvIndex <= 10) return 'Muy alto';
    return 'Extremo';
  };



  // Solicitar permisos de ubicación al cargar el componente
  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requieren permisos de ubicación para la navegación');
        return;
      }
      
      setLocationPermissionGranted(true);
      getCurrentLocation();
    })();
  }, []);

  // Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    try {
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.BestForNavigation,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Función para centrar el mapa en la ubicación del usuario
  const centerOnUserLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  };
  

  useEffect(() => {
    if (originSede && destinationSede) {
      fetchTemperature(locations[originSede].latitude, locations[originSede].longitude);
      fetchUVIndex(locations[originSede].latitude, locations[originSede].longitude);
      let newRoute: { latitude: number; longitude: number }[] = [];
  
      const now = new Date();
      const currentHour = now.getHours();
  

      if (currentHour >= 6 && currentHour < 13) {
        // Rutas de 6:00 AM a 1:00 PM
        if (originSede === 'H1' && destinationSede === 'H3') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H1') {
          newRoute = [
              locations.H3,
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H6') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994100, longitude: -74.792797 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995684, longitude: -74.795164 },
              { latitude: 10.995300, longitude: -74.795821 },
              { latitude: 10.995537, longitude: -74.796272 },
              locations.H6,
          ];
        } else if (originSede === 'H6' && destinationSede === 'H1') {
          newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.995300, longitude: -74.795821 },
              { latitude: 10.995684, longitude: -74.795164 },
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.994100, longitude: -74.792797 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H4') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994100, longitude: -74.792797 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995613, longitude: -74.795054 },
              locations.H4,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H1') {
          newRoute = [
              locations.H4,
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.994100, longitude: -74.792797 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
  
        } else if (originSede === 'H1' && destinationSede === 'H2') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H1') {
          newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H4') {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.994810, longitude:-74.793729 },
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H2') {
      newRoute = [
          locations.H4,
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995531, longitude: -74.794467 },
          { latitude: 10.994810, longitude: -74.793729 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.995129, longitude: -74.792534 },
          locations.H2,
      ];
        
        } else if (originSede === 'H2' && destinationSede === 'H6') {
          newRoute = [
            locations.H2,    
            { latitude: 10.995129, longitude: -74.792534 }, 
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.994810, longitude:-74.793729 },
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude:-74.795196  },
            { latitude: 10.995300, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },
  
            locations.H6,
          ];
        } else if (originSede === 'H6' && destinationSede === 'H2') {
          newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.995300, longitude: -74.795821 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.994810, longitude: -74.793729 },
              { latitude: 10.994900, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H6') {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063},    
            { latitude: 10.995129, longitude: -74.792534 }, 
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.994810, longitude:-74.793729 },
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude:-74.795196  },
            { latitude: 10.995300, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },
  
            locations.H6,
          ];
        } else if (originSede === 'H6' && destinationSede === 'H7') {
          newRoute = [
            locations.H6,
            { latitude: 10.995537, longitude: -74.796272 },
            { latitude: 10.995300, longitude: -74.795821 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.994810, longitude: -74.793729 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },    
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H1') {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H7') {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H3') {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H7') {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H2') {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H7') {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H4') {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063},
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.994810, longitude:-74.793729 },
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H7') {
          newRoute = [
            locations.H4,
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.994810, longitude: -74.793729 },
            { latitude: 10.994900, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];        
        
        } else if (originSede === 'H3' && destinationSede === 'H4') {
          newRoute = [
            locations.H3,      
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },         
            { latitude: 10.994810, longitude:-74.793729 },
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995444, longitude:-74.794625 }, 
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
  
        } else if (originSede === 'H4' && destinationSede === 'H3') {
          newRoute = [
              locations.H4,
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.994810, longitude: -74.793729 },
              { latitude: 10.994900, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              locations.H3,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H6') {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826},
            { latitude: 10.995516, longitude:-74.796250  },
            locations.H6,
          ];
        
        } else if (originSede === 'H6' && destinationSede === 'H4') {
          newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.796250 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H6') {
          newRoute = [
            locations.H3,    
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.994900, longitude: -74.793641 },               
            { latitude: 10.994810, longitude:-74.793729 },    
            { latitude: 10.995531, longitude:  -74.794467 },
            { latitude: 10.995444, longitude:-74.794625},
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude:-74.795196  },
            { latitude: 10.995300, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },
            locations.H6,
          ];
        } else if (originSede === 'H6' && destinationSede === 'H3') {
          newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.995300, longitude: -74.795821 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.994810, longitude: -74.793729 },
              { latitude: 10.994900, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              locations.H3,
          ];
        }
        
      } else if (currentHour >= 13 && currentHour < 14) {
        // Rutas de 1:00 PM a 2:00 PM
        if (originSede === 'H1' && destinationSede === 'H3') {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H1') {
          newRoute = [
            locations.H3,
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H1') {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H7') {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H3') {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H7') {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H2') {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H7') {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H7,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H2') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H1') {
          newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H6') {
          newRoute = [
              locations.H1,
              { latitude: 10.994381, longitude: -74.792350 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994100, longitude: -74.792807 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.995480, longitude: -74.794600 },
              { latitude: 10.995615, longitude: -74.794780 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995475, longitude: -74.796161 },
              locations.H6,
          ];
  
        } else if (originSede === 'H6' && destinationSede === 'H1') {
          newRoute = [
              locations.H6,
              { latitude: 10.995475, longitude: -74.796161 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.794780 },
              { latitude: 10.995480, longitude: -74.794600 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994100, longitude: -74.792807 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994381, longitude: -74.792350 },
              locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H4') {
          newRoute = [
              locations.H1,
              { latitude: 10.994381, longitude: -74.792350 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994100, longitude: -74.792807 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.995480, longitude: -74.794600 },
              { latitude: 10.995615, longitude: -74.794780 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              locations.H4,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H1') {
          newRoute = [
              locations.H4,
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.794780 },
              { latitude: 10.995480, longitude: -74.794600 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994100, longitude: -74.792807 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994381, longitude: -74.792350 },
              locations.H1,
          ];
          
        } else if (originSede === 'H4' && destinationSede === 'H6') {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826},
            { latitude: 10.995516, longitude:-74.796250  },
            locations.H6,
          ];
        
        } else if (originSede === 'H6' && destinationSede === 'H4') {
          newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.796250 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
          ];
        }  else if (originSede === 'H2' && destinationSede === 'H6') {
            newRoute = [
                locations.H2,
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995665, longitude: -74.795144 },
                { latitude: 10.995278, longitude: -74.795805 },
                { latitude: 10.995475, longitude: -74.796161 },
                locations.H6,
            ];
          }  else if (originSede === 'H6' && destinationSede === 'H2') {
            newRoute = [
                locations.H6,
                { latitude: 10.995475, longitude: -74.796161 },
                { latitude: 10.995278, longitude: -74.795805 },
                { latitude: 10.995665, longitude: -74.795144 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.995129, longitude: -74.792534 },
                locations.H2,
            ];
          }  else if (originSede === 'H7' && destinationSede === 'H6') {
            newRoute = [
                locations.H7,
                { latitude: 10.994794, longitude: -74.792063},
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995665, longitude: -74.795144 },
                { latitude: 10.995278, longitude: -74.795805 },
                { latitude: 10.995475, longitude: -74.796161 },
                locations.H6,
            ];
          } else if (originSede === 'H6' && destinationSede === 'H7') {
            newRoute = [
                locations.H6,
                { latitude: 10.995475, longitude: -74.796161 },
                { latitude: 10.995278, longitude: -74.795805 },
                { latitude: 10.995665, longitude: -74.795144 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.994794, longitude: -74.792063 },
                locations.H7,
            ];

          }  else if (originSede === 'H7' && destinationSede === 'H4') {
            newRoute = [
                locations.H7,
                { latitude: 10.994794, longitude: -74.792063},
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995665, longitude: -74.795144 },
                locations.H4,
            ];
          } else if (originSede === 'H4' && destinationSede === 'H7') {
            newRoute = [
                locations.H4,
                { latitude: 10.995665, longitude: -74.795144 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.994794, longitude: -74.792063 },
                locations.H7,
            ];

          }  else if (originSede === 'H2' && destinationSede === 'H4') {
            newRoute = [
                locations.H2,
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.995618, longitude: -74.792937 },
                { latitude: 10.994914, longitude: -74.793654 },
                { latitude: 10.995607, longitude: -74.794399 },
                { latitude: 10.995480, longitude: -74.794600 },
                { latitude: 10.995615, longitude: -74.794780 },
                { latitude: 10.995562, longitude: -74.795032 },
                { latitude: 10.995665, longitude: -74.795144 },
                locations.H4,
            ];
          }  else if (originSede === 'H4' && destinationSede === 'H2') {
              newRoute = [
                  locations.H4,
                  { latitude: 10.995665, longitude: -74.795144 },
                  { latitude: 10.995562, longitude: -74.795032 },
                  { latitude: 10.995615, longitude: -74.794780 },
                  { latitude: 10.995480, longitude: -74.794600 },
                  { latitude: 10.995607, longitude: -74.794399 },
                  { latitude: 10.994914, longitude: -74.793654 },
                  { latitude: 10.995618, longitude: -74.792937 },
                  { latitude: 10.995129, longitude: -74.792534 },
                  locations.H2,
              ];
            }  else if (originSede === 'H3' && destinationSede === 'H4') {
              newRoute = [
                  locations.H3,
                  { latitude: 10.995618, longitude: -74.792937 },
                  { latitude: 10.994914, longitude: -74.793654 },
                  { latitude: 10.995607, longitude: -74.794399 },
                  { latitude: 10.995480, longitude: -74.794600 },
                  { latitude: 10.995615, longitude: -74.794780 },
                  { latitude: 10.995562, longitude: -74.795032 },
                  { latitude: 10.995665, longitude: -74.795144 },
                  locations.H4,
              ];
            }  else if (originSede === 'H4' && destinationSede === 'H3') {
              newRoute = [
                  locations.H4,
                  { latitude: 10.995665, longitude: -74.795144 },
                  { latitude: 10.995562, longitude: -74.795032 },
                  { latitude: 10.995615, longitude: -74.794780 },
                  { latitude: 10.995480, longitude: -74.794600 },
                  { latitude: 10.995607, longitude: -74.794399 },
                  { latitude: 10.994914, longitude: -74.793654 },
                  { latitude: 10.995618, longitude: -74.792937 },
                  { latitude: 10.995129, longitude: -74.792534 },
                  locations.H3,
              ];
            }  else if (originSede === 'H3' && destinationSede === 'H6') {
              newRoute = [
                  locations.H3,
                  { latitude: 10.995618, longitude: -74.792937 },
                  { latitude: 10.994914, longitude: -74.793654 },
                  { latitude: 10.995607, longitude: -74.794399 },
                  { latitude: 10.995480, longitude: -74.794600 },
                  { latitude: 10.995615, longitude: -74.794780 },
                  { latitude: 10.995562, longitude: -74.795032 },
                  { latitude: 10.995665, longitude: -74.795144 },
                  { latitude: 10.995278, longitude: -74.795805 },
                  { latitude: 10.995475, longitude: -74.796161 },
                  locations.H6,
              ];
            }  else if (originSede === 'H6' && destinationSede === 'H3') {
              newRoute = [
                  locations.H6,
                  { latitude: 10.995475, longitude: -74.796161 },
                  { latitude: 10.995278, longitude: -74.795805 },
                  { latitude: 10.995665, longitude: -74.795144 },
                  { latitude: 10.995562, longitude: -74.795032 },
                  { latitude: 10.995615, longitude: -74.794780 },
                  { latitude: 10.995480, longitude: -74.794600 },
                  { latitude: 10.995607, longitude: -74.794399 },
                  { latitude: 10.994914, longitude: -74.793654 },
                  { latitude: 10.995618, longitude: -74.792937 },
                  locations.H3,
              ];
        }
       
      } else {
        // Rutas de 2:00 PM a 6:00 AM
        if (originSede === 'H1' && destinationSede === 'H3') {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H1') {
          newRoute = [
            locations.H3,
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H1') {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H7') {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H3') {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H3,
          ];
        } else if (originSede === 'H3' && destinationSede === 'H7') {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063},     
            locations.H7,
          ];
        } else if (originSede === 'H7' && destinationSede === 'H2') {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H7') {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991},     
            locations.H7,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H6') {
          newRoute = [
            locations.H1,
            { latitude: 10.993923, longitude: -74.792513 },
            { latitude: 10.993815, longitude: -74.792458 },
            { latitude: 10.993563, longitude: -74.792607 },
            { latitude: 10.993605, longitude: -74.792722 },
            { latitude: 10.993705, longitude: -74.792891 },
            { latitude: 10.993842, longitude: -74.792883 },
            { latitude: 10.995467, longitude: -74.794667 },
            { latitude: 10.995609, longitude: -74.795053 },
            { latitude: 10.995672, longitude: -74.795252 },
            { latitude: 10.995319, longitude: -74.795831 },
            { latitude: 10.995560, longitude: -74.796290 },
            locations.H6,
          ];
        } else if (originSede === 'H6' && destinationSede === 'H1') {
          newRoute = [
            locations.H6,
            { latitude: 10.995560, longitude: -74.796290 },
            { latitude: 10.995319, longitude: -74.795831 },
            { latitude: 10.995672, longitude: -74.795252 },
            { latitude: 10.995609, longitude: -74.795053 },
            { latitude: 10.995467, longitude: -74.794667 },
            { latitude: 10.993842, longitude: -74.792883 },
            { latitude: 10.993705, longitude: -74.792891 },
            { latitude: 10.993605, longitude: -74.792722 },
            { latitude: 10.993563, longitude: -74.792607 },
            { latitude: 10.993815, longitude: -74.792458 },
            { latitude: 10.993923, longitude: -74.792513 },
            locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H4') {
          newRoute = [
            locations.H1,
            { latitude: 10.993923, longitude: -74.792513 },
            { latitude: 10.993815, longitude: -74.792458 },
            { latitude: 10.993563, longitude: -74.792607 },
            { latitude: 10.993605, longitude: -74.792722 },
            { latitude: 10.993705, longitude: -74.792891 },
            { latitude: 10.993842, longitude: -74.792883 },
            { latitude: 10.995467, longitude: -74.794667 },
            { latitude: 10.995609, longitude: -74.795053 },
            { latitude: 10.995672, longitude: -74.795252 },
            locations.H4,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H1') {
          newRoute = [
            locations.H4,
            { latitude: 10.995672, longitude: -74.795252 },
            { latitude: 10.995609, longitude: -74.795053 },
            { latitude: 10.995467, longitude: -74.794667 },
            { latitude: 10.993842, longitude: -74.792883 },
            { latitude: 10.993705, longitude: -74.792891 },
            { latitude: 10.993605, longitude: -74.792722 },
            { latitude: 10.993563, longitude: -74.792607 },
            { latitude: 10.993815, longitude: -74.792458 },
            { latitude: 10.993923, longitude: -74.792513 },
            locations.H1,
          ];
        } else if (originSede === 'H1' && destinationSede === 'H2') {
          newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
          ];
        } else if (originSede === 'H2' && destinationSede === 'H4') {
          newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995609, longitude: -74.792920 },
              { latitude: 10.994975, longitude: -74.793551},
              { latitude: 10.994892, longitude: -74.793631},
              { latitude: 10.995079, longitude: -74.793834},
              { latitude: 10.994898, longitude: -74.794025},
              { latitude: 10.995521, longitude: -74.794663},
              { latitude: 10.995618, longitude: -74.794968},
              { latitude: 10.995568, longitude: -74.795071},
              { latitude: 10.995729, longitude: -74.795229},
              locations.H4,
          ];
        }   else if (originSede === 'H4' && destinationSede === 'H2') {
            newRoute = [
              locations.H4,
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.792920 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === 'H7' && destinationSede === 'H4') {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063},    
              { latitude: 10.995129, longitude: -74.792534 }, 
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.996617, longitude: -74.796720 },
              locations.H4,
            ];
          } else if (originSede === 'H4' && destinationSede === 'H7') {
            newRoute = [
              locations.H4,
              { latitude: 10.996617, longitude: -74.796720 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === 'H7' && destinationSede === 'H6') {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063},    
              { latitude: 10.995129, longitude: -74.792534 }, 
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.995300, longitude: -74.795833 },
              { latitude: 10.995469, longitude: -74.796160},
              locations.H6,
            ];
          } else if (originSede === 'H6' && destinationSede === 'H7') {
            newRoute = [
              locations.H6,
              { latitude: 10.995469, longitude: -74.796160 },
              { latitude: 10.995300, longitude: -74.795833 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];


          } else if (originSede === 'H2' && destinationSede === 'H6') {
            newRoute = [
                locations.H2,
                { latitude: 10.995129, longitude: -74.792534 },
                { latitude: 10.995609, longitude: -74.792920 },
                { latitude: 10.994975, longitude: -74.793551},
                { latitude: 10.994892, longitude: -74.793631},
                { latitude: 10.995079, longitude: -74.793834},
                { latitude: 10.994898, longitude: -74.794025},
                { latitude: 10.995521, longitude: -74.794663},
                { latitude: 10.995618, longitude: -74.794968},
                { latitude: 10.995568, longitude: -74.795071},
                { latitude: 10.995729, longitude: -74.795229},
                { latitude: 10.995295, longitude: -74.795802},
                { latitude: 10.995527, longitude: -74.796239},
                locations.H6,
            ];
          } else if (originSede === 'H6' && destinationSede === 'H2') {
            newRoute = [
              locations.H6,
              { latitude: 10.995527, longitude: -74.796239 },
              { latitude: 10.995295, longitude: -74.795802 },
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.792920 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === 'H3' && destinationSede === 'H4') {
            newRoute = [
                locations.H3,
                { latitude: 10.995609, longitude: -74.792920 },
                { latitude: 10.994975, longitude: -74.793551},
                { latitude: 10.994892, longitude: -74.793631},
                { latitude: 10.995079, longitude: -74.793834},
                { latitude: 10.994898, longitude: -74.794025},
                { latitude: 10.995521, longitude: -74.794663},
                { latitude: 10.995618, longitude: -74.794968},
                { latitude: 10.995568, longitude: -74.795071},
                { latitude: 10.995729, longitude: -74.795229},
                locations.H4,
            ];
          } else if (originSede === 'H4' && destinationSede === 'H3') {
            newRoute = [
              locations.H4,
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.792920 },
              locations.H3,
            ];
          } else if (originSede === 'H3' && destinationSede === 'H6') {
            newRoute = [
                locations.H3,
                { latitude: 10.995609, longitude: -74.792920 },
                { latitude: 10.994975, longitude: -74.793551},
                { latitude: 10.994892, longitude: -74.793631},
                { latitude: 10.995079, longitude: -74.793834},
                { latitude: 10.994898, longitude: -74.794025},
                { latitude: 10.995521, longitude: -74.794663},
                { latitude: 10.995618, longitude: -74.794968},
                { latitude: 10.995568, longitude: -74.795071},
                { latitude: 10.995729, longitude: -74.795229},
                { latitude: 10.995295, longitude: -74.795802},
                { latitude: 10.995527, longitude: -74.796239},
                locations.H6,
            ];
          }  else if (originSede === 'H6' && destinationSede === 'H3') {
              newRoute = [
                  locations.H6,
                  { latitude: 10.995527, longitude: -74.796239 },
                  { latitude: 10.995295, longitude: -74.795802 },
                  { latitude: 10.995729, longitude: -74.795229 },
                  { latitude: 10.995568, longitude: -74.795071 },
                  { latitude: 10.995618, longitude: -74.794968 },
                  { latitude: 10.995521, longitude: -74.794663 },
                  { latitude: 10.994898, longitude: -74.794025 },
                  { latitude: 10.995079, longitude: -74.793834 },
                  { latitude: 10.994892, longitude: -74.793631 },
                  { latitude: 10.994975, longitude: -74.793551 },
                  { latitude: 10.995609, longitude: -74.792920 },
                  locations.H3,
              ];
        } else if (originSede === 'H2' && destinationSede === 'H1') {
          newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
          ];
        } else if (originSede === 'H4' && destinationSede === 'H6') {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826},
            { latitude: 10.995516, longitude:-74.796250  },
            locations.H6,
          ];
        
        } else if (originSede === 'H6' && destinationSede === 'H4') {
          newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.796250 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
          ];
        }
      }
  
      // Si no se encontró una ruta específica para el horario, usar la ruta predeterminada
      if (newRoute.length === 0) {
        newRoute = [locations[originSede], locations[destinationSede]];
      }
  
      setRoute(newRoute);
      animateRoute(newRoute);
  
      if (mapRef.current && newRoute.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(newRoute, {
            edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
            animated: true,
          });
        }, 500);
      }
  
      toggleRouteDetails(true);
    } else {
      setRoute([]);
      setAnimatedRoute([]);
      toggleRouteDetails(false);
    }
  }, [originSede, destinationSede]);

  const toggleRouteDetails = (show: boolean) => {
    setRouteDetails(show);
    Animated.parallel([
      Animated.timing(panelHeight, {
        toValue: show ? 350 : 127,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(detailsOpacity, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
  };

  const fetchTemperature = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      setTemperature(response.data.main.temp);
      setWeather(response.data.weather[0].main);
      setHumidity(response.data.main.humidity);
      setFeelsLike(response.data.main.feels_like); // <- Añadir esto
    } catch (error) {
      console.error('Error obteniendo la temperatura', error);
    } finally {
      setLoading(false);
    }
  };

  const interpolatePoints = (start: Location, end: Location, steps: number): Location[] => {
    const points: Location[] = [];
    for (let i = 0; i <= steps; i++) {
      const lat = start.latitude + (i / steps) * (end.latitude - start.latitude);
      const lon = start.longitude + (i / steps) * (end.longitude - start.longitude);
      points.push({ latitude: lat, longitude: lon });
    }
    return points;
  };

  const animateRoute = (fullRoute: Location[]) => {
    if (!fullRoute || fullRoute.length === 0) return;
    setAnimatedRoute([]);
    let index = 0;

    const animateStep = () => {
      if (index < fullRoute.length - 1) {
        const nextSegment = interpolatePoints(fullRoute[index], fullRoute[index + 1], 15);
        setAnimatedRoute((prev) => [...prev, ...nextSegment]);
        index++;

        if (index < fullRoute.length - 1) {
          requestAnimationFrame(animateStep);
        }
      }
    };

    animateStep();
  };

  const getWeatherIcon = () => {
    if (!weather) return 'cloud-outline';
    
    switch(weather.toLowerCase()) {
      case 'clear': return 'sunny-outline';
      case 'clouds': return 'cloudy-outline';
      case 'rain': return 'rainy-outline';
      case 'thunderstorm': return 'thunderstorm-outline';
      case 'snow': return 'snow-outline';
      default: return 'cloud-outline';
    }
  };

  const swapLocations = () => {
    if (originSede && destinationSede) {
      setOriginSede(destinationSede);
      setDestinationSede(originSede);
    }
  };

  const openSedeSelector = (type: 'origin' | 'destination') => {
    setSelectionType(type);
    setSedeSearch('');
    setModalVisible(true);
  };

  const selectSede = (sede: LocationKey) => {
    if (selectionType === 'origin') {
      setOriginSede(sede);
    } else {
      setDestinationSede(sede);
    }
    setModalVisible(false);
  };

  const filteredSedes = Object.keys(locations).filter(
    (sede): sede is LocationKey => {
      const searchTerm = sedeSearch.toLowerCase();
      return sedeNames[sede as LocationKey].toLowerCase().includes(searchTerm) ||
             sede.toLowerCase().includes(searchTerm) ||
             sedeAddresses[sede as LocationKey].toLowerCase().includes(searchTerm);
    }
  );

  const calculateDistance = (): string | null => {
    if (!originSede || !destinationSede) return null;
    
    const R = 6371; // Radio de la Tierra en km
    const lat1 = locations[originSede].latitude;
    const lon1 = locations[originSede].longitude;
    const lat2 = locations[destinationSede].latitude;
    const lon2 = locations[destinationSede].longitude;
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return (distance * 1000).toFixed(0);
  };

  // Función para abrir Google Maps con la ruta predefinida
  const openGoogleMaps = () => {
    if (!originSede || !destinationSede || route.length === 0) return;

    const waypoints = route.slice(1, -1).map(point => `${point.latitude},${point.longitude}`).join('/');
    const url = `https://www.google.com/maps/dir/${locations[originSede].latitude},${locations[originSede].longitude}/${waypoints}/${locations[destinationSede].latitude},${locations[destinationSede].longitude}`;

    Linking.openURL(url).catch(err => console.error("No se pudo abrir Google Maps", err));
  };
  const gridData = [
    [
      {
        icon: 'walk-outline',
        value: calculateDistance() ? `${calculateDistance()} m` : '--',
        label: 'Distancia'
      },
      {
        icon: 'time-outline',
        value: calculateDistance() ? `${Math.round(Number(calculateDistance()) / 85)} min` : '--',
        label: 'Tiempo estimado'
      },
      {
        icon: getWeatherIcon(),
        value: temperature ? `${temperature.toFixed(1)}°C` : '--',
        label: 'Temperatura'
      }
    ],
    [
      {
        icon: 'water-outline',
        value: humidity ? `${humidity}%` : '--',
        label: 'Humedad'
      },
      {
        icon: 'thermometer-outline',
        value: feelsLike ? `${feelsLike.toFixed(1)}°C` : '--',
        label: 'Sensación térmica'
      },
      {
        icon: 'sunny-outline',
        value: uvIndex !== null ? `UV: ${uvIndex}` : 'UV: --',
        label: uvIndex !== null ? ` ${getUVDescription(uvIndex)}` : 'Índice UV', // Aquí se añade "UV" antes de la descripción
        
      }
    ]
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 10.995,
          longitude: -74.794,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={mapType === 'standard' ? mapStyle : undefined}
        mapType={mapType}
        showsUserLocation={false}
      >
        {Object.entries(locations).map(([key, location]) => (
          <CustomMarker
            key={key}
            locationKey={key as LocationKey}
            location={location}
            title={sedeNames[key as LocationKey]}
            description={sedeAddresses[key as LocationKey]}
            isSelected={key === originSede || key === destinationSede}
            onPress={() => {
              if (!originSede) {
                setOriginSede(key as LocationKey);
              } else if (!destinationSede && key !== originSede) {
                setDestinationSede(key as LocationKey);
              }
            }}
          />
        ))}
        
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Mi ubicación"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationPulse} />
            </View>
          </Marker>
        )}
        
        {animatedRoute.length > 0 && (
          <Polyline
            coordinates={animatedRoute}
            strokeColor="#2ecc71"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <Ionicons 
          name="locate" 
          size={22} 
          color="#2ecc71" 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.mapTypeButton}
        onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
      >
        <Ionicons 
          name={mapType === 'standard' ? 'map' : 'map-outline'} 
          size={22} 
          color="#2ecc71" 
        />
      </TouchableOpacity>
      
      

      <Animated.View style={[styles.panel, { height: panelHeight }]}>
      <View style={styles.panelHandle} {...panResponder.panHandlers}>
  <View style={styles.panelHandleBar} />
</View>
        
        <View style={styles.routeSelectors}>
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={() => openSedeSelector('origin')}
          >
            <Ionicons name="location" size={18} color="#2ecc71" />
            <Text style={styles.locationText}>
              {originSede ? sedeNames[originSede] : 'Origen'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
            <Ionicons name="swap-vertical" size={20} color="#2ecc71" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={() => openSedeSelector('destination')}
          >
            <Ionicons name="flag" size={18} color="#2ecc71" />
            <Text style={styles.locationText}>
              {destinationSede ? sedeNames[destinationSede] : 'Destino'}
            </Text>
          </TouchableOpacity>
          
        </View>
        
        <Animated.View style={[styles.routeDetails, { opacity: detailsOpacity }]}>
  <View style={styles.routeInfoContainer}></View>
  
  <FlatList
  data={gridData}
  scrollEnabled={false}
  keyExtractor={(_, index) => `row-${index}`}
  renderItem={({ item: row, index: rowIndex }) => (
    <View style={styles.infoRow}>
      {row.map((card, cardIndex) => (
        <AnimatedTouchableItem
          key={`card-${cardIndex}`}
          onPress={() => setSelectedGridItem(
            prev => prev?.row === rowIndex && prev?.col === cardIndex 
              ? null 
              : { row: rowIndex, col: cardIndex }
          )}
          accessibilityLabel={`${card.label}: ${card.value}`}
          accessibilityHint={
            selectedGridItem?.row === rowIndex && selectedGridItem?.col === cardIndex
              ? "Tarjeta seleccionada. Toca para deseleccionar."
              : "Toca para seleccionar esta tarjeta."
          }
          accessibilityRole="button"
        >
          <View style={[
            styles.infoCardContent,
            selectedGridItem?.row === rowIndex && 
            selectedGridItem?.col === cardIndex && 
            styles.selectedCard
          ]}>
            <Ionicons 
              name={card.icon as any} 
              size={24} 
              color="#2ecc71" 
              accessible={false} // Evita que el ícono sea leído por el lector de pantalla
            />
            <Text 
              style={styles.infoValue}
              accessible={true}
              accessibilityLabel={`Valor: ${card.value}`}
            >
              {card.value}
            </Text>
            <Text 
              style={styles.infoLabel}
              accessible={true}
              accessibilityLabel={`Descripción: ${card.label}`}
            >
              {card.label}
            </Text>
          </View>
        </AnimatedTouchableItem>
      ))}
    </View>
  )}
  contentContainerStyle={styles.routeInfoGrid}
/>

  <View style={styles.actionButtons}>
    <TouchableOpacity 
      style={[styles.actionButton, styles.primaryButton]}
      onPress={openGoogleMaps}
      disabled={!originSede || !destinationSede}
    >
      <Ionicons name="navigate" size={20} color="#FFF" />
      <Text style={styles.buttonText}>Iniciar</Text>
    </TouchableOpacity>
  </View>
</Animated.View>
      </Animated.View>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar {selectionType === 'origin' ? 'origen' : 'destino'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2ecc71" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar sede..."
                value={sedeSearch}
                onChangeText={setSedeSearch}
                autoFocus={true}
              />
            </View>
            
            
            <ScrollView style={styles.sedeList}>
              {filteredSedes.map((sede) => (
                <SedeItem 
                  key={sede}
                  sede={sede}
                  onSelect={selectSede} selectionType={'origin'}                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationButton: {
    position: 'absolute',
    top: hp('10%'),
    right: wp('4%'),
    backgroundColor: 'white',
    borderRadius: 30,
    width: wp('12%'),
    height: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mapTypeButton: {
    position: 'absolute',
    top: hp('18%'),
    right: wp('4%'),
    backgroundColor: 'white',
    borderRadius: 30,
    width: wp('12%'),
    height: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: wp('5%'), // Antes: 40
    paddingBottom: hp('7%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 12, 
    zIndex: 10, 
    height: hp('40%'), // ✅ 40% de la altura
  },
  panelHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 5,
  },
  
  routeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  locationSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: -14,
  },
  locationText: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '500',
  },
  swapButton: {
    marginHorizontal: 18,
    zIndex: 1,
  },
  swapButtonInner: {
    backgroundColor: '#2ecc71',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeDetails: {
    marginTop: -1,
    paddingHorizontal: 0, 
  },
  routeInfo: {
    flexDirection: 'column', 
    justifyContent: 'space-between',
  },
  routeInfoGrid: {
    padding: 0,
  },
  routeInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribuye el espacio entre las tarjetas
    marginBottom: 16,
    paddingHorizontal: 0,
    width: '100%', // Asegura que la fila ocupe todo el ancho disponible
    overflow: 'visible', // Añadido
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  infoText: {
    marginLeft: 5,
    color: '#333',
    fontSize: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    position: 'relative',
    overflow: 'visible', // Cambiado de 'hidden'
    aspectRatio: 1,

  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  infoLabel: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 6,
    borderRadius: 10,
    flex: 1,
    margin: 0,
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    minHeight: hp('70%'), // ✅ 70% de la altura
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 10,
  },
  sedeList: {
    flex: 1,
  },
  sedeItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sedeIconContainer: {
    marginRight: 12,
  },
  sedeInfoContainer: {
    flex: 1,
  },
  sedeName: {
    fontSize: hp('2%'),   // Antes: 16
    color: '#333',
    fontWeight: '500',
  },
  sedeAddress: {
    fontSize: hp('1.8%'),
    color: '#666',
    marginTop: hp('0.5%'),
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: 'white',
    zIndex: 2,
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    zIndex: 1,
  },
  placeholderText: {
    color: '#a4b0be',
    fontStyle: 'italic',
  },
  infoCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '125%',
    height: '130%', // Ocupa todo el espacio del contenedor padre
  },
  selectedCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,  // Aumentar el radio de borde // Hacer el borde más grueso
    borderColor: '#2ecc71',
    padding: 0,     // Aumentar el espacio interno
    // Añadir sombra para mayor profundidad
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 999, // Añadido para superposición
  },

  panelHandleBar: {
    width: 50,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
});

function setCustomDimensions(arg0: { width: number; height: number; }) {
  throw new Error('Function not implemented.');
}
