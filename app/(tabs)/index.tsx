import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, TouchableOpacity, View, Text, StyleSheet, Modal, TextInput, ScrollView, Alert } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import * as ExpoLocation from 'expo-location';
import CustomMarker, { LocationKey, Location } from '../../assets/markers';

const API_KEY = '01d1e2a2ab57d9ea74d3d44680b5d8d7';
const { height, width } = Dimensions.get('window');

// Datos de ubicaciones
const locations: Record<LocationKey, Location> = {
  H1: { latitude: 10.994316, longitude: -74.792363 },
  H2: { latitude: 10.995100, longitude: -74.792288 },
  H3: { latitude: 10.995105, longitude: -74.792355 },
  H4: { latitude: 10.996687, longitude: -74.796749 },
  H6: { latitude: 10.995328, longitude: -74.796315 },
};

const sedeNames: Record<LocationKey, string> = {
  H1: 'Sede 1',
  H2: 'Sede 2',
  H3: 'Sede 3',
  H4: 'Sede Postgrados',
  H6: 'Sede de Investigación',
};

const sedeAddresses: Record<LocationKey, string> = {
  H1: 'Bloque H1, Campus Norte',
  H2: 'Bloque H2, Campus Norte',
  H3: 'Bloque H3, Campus Norte',
  H4: 'Bloque H4, Campus Sur',
  H6: 'Bloque H6, Campus Sur',
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
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

// Componente SedeItem
const SedeItem = ({ sede, onSelect }: { sede: LocationKey, onSelect: (sede: LocationKey) => void }) => {
  return (
    <TouchableOpacity 
      style={styles.sedeItem} 
      onPress={() => onSelect(sede)}
    >
      <View style={styles.sedeIconContainer}>
        <Ionicons 
          name="location" 
          size={24} 
          color="#1ABC9C" 
        />
      </View>
      <View style={styles.sedeInfoContainer}>
        <Text style={styles.sedeName}>{sedeNames[sede]}</Text>
        <Text style={styles.sedeAddress}>{sedeAddresses[sede]}</Text>
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
      let newRoute = [];

      if (originSede === 'H1' && destinationSede === 'H3') {
        newRoute = [
          locations.H1,
          { latitude: 10.994554, longitude: -74.792147 },
          { latitude: 10.994723, longitude: -74.791980 },
          locations.H3,
        ];
      } else if (originSede === 'H3' && destinationSede === 'H1') {
        newRoute = [
          locations.H3,
          { latitude: 10.994723, longitude: -74.791980 },
          { latitude: 10.994554, longitude: -74.792147 },
          locations.H1,
        ];
      } else if (originSede === 'H1' && destinationSede === 'H6') {
        newRoute = [
          locations.H1,
          { latitude: 10.993781, longitude: -74.792815 },
          { latitude: 10.995538, longitude: -74.794655 },
          { latitude: 10.995648, longitude: -74.795086 },
          { latitude: 10.995228, longitude: -74.795794 },
          locations.H6,
        ];
      } else if (originSede === 'H6' && destinationSede === 'H1') {
        newRoute = [
          locations.H6,
          { latitude: 10.995228, longitude: -74.795794 },
          { latitude: 10.995648, longitude: -74.795086 },
          { latitude: 10.995538, longitude: -74.794655 },
          { latitude: 10.993781, longitude: -74.792815 },
          locations.H1,
        ];
      } else if (originSede === 'H1' && destinationSede === 'H4') {
        newRoute = [
          locations.H1,
          { latitude: 10.993781, longitude: -74.792815 },
          { latitude: 10.995538, longitude: -74.794655 },
          { latitude: 10.995648, longitude: -74.795086 },
          locations.H4,
        ];
      } else if (originSede === 'H4' && destinationSede === 'H1') {
        newRoute = [
          locations.H4,
          { latitude: 10.995648, longitude: -74.795086 },
          { latitude: 10.995538, longitude: -74.794655 },
          { latitude: 10.993781, longitude: -74.792815 },
          locations.H1,
        ];

      } else if (originSede === 'H1' && destinationSede === 'H2') {
        newRoute = [
          locations.H1,
          { latitude: 10.994316, longitude: -74.792363 },
          { latitude: 10.994715, longitude: -74.792041 },
          { latitude: 10.995042, longitude: -74.792362 },
          { latitude: 10.995100, longitude: -74.792288 },
          locations.H2,
        ];
      } else if (originSede === 'H2' && destinationSede === 'H1') {
        newRoute = [
          locations.H2,
          { latitude: 10.995100, longitude: -74.792288 },
          { latitude: 10.995042, longitude: -74.792362 },
          { latitude: 10.994715, longitude: -74.792041 },
          { latitude: 10.994316, longitude: -74.792363 },
          locations.H1,
        ];
      } else if (originSede === 'H2' && destinationSede === 'H4') {
        newRoute = [
          locations.H2,
          { latitude: 10.995100, longitude: -74.792288 },
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.996687, longitude: -74.796749 },
          locations.H4,
        ];
      } else if (originSede === 'H4' && destinationSede === 'H2') {
        newRoute = [
          locations.H4,
          { latitude: 10.996687, longitude: -74.796749 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.995100, longitude: -74.792288 },
          locations.H2,
        ];
      
      } else if (originSede === 'H2' && destinationSede === 'H6') {
        newRoute = [
          locations.H2,
          { latitude: 10.995100, longitude: -74.792288 },
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995183, longitude: -74.795849 },
          { latitude: 10.995328, longitude: -74.796315 },
          locations.H6,
        ];
      } else if (originSede === 'H6' && destinationSede === 'H2') {
        newRoute = [
          locations.H6,
          { latitude: 10.995328, longitude: -74.796315 },
          { latitude: 10.995183, longitude: -74.795849 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.995100, longitude: -74.792288 },
          locations.H2,
        ];
      
      } else if (originSede === 'H3' && destinationSede === 'H4') {
        newRoute = [
          locations.H3,      
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.996687, longitude: -74.796749 },
          locations.H4,
        ];

      } else if (originSede === 'H4' && destinationSede === 'H3') {
        newRoute = [
          locations.H4,
          { latitude: 10.996687, longitude: -74.796749 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995629, longitude: -74.792918 },
          locations.H3,
        ];
        
      } else if (originSede === 'H4' && destinationSede === 'H6') {
        newRoute = [
          locations.H4,
          { latitude: 10.995682, longitude: -74.795133 },
          { latitude: 10.995234, longitude: -74.795902 },
          locations.H6,
        ];
      
      } else if (originSede === 'H6' && destinationSede === 'H4') {
        newRoute = [
          locations.H6,
          { latitude: 10.995234, longitude: -74.795902 },
          { latitude: 10.995682, longitude: -74.795133 },
          locations.H4,
        ];
      } else if (originSede === 'H3' && destinationSede === 'H6') {
        newRoute = [
          locations.H3,
          { latitude: 10.995629, longitude: -74.792918 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995183, longitude: -74.795849 },
          { latitude: 10.995328, longitude: -74.796315 },
          locations.H6,
        ];
      } else if (originSede === 'H6' && destinationSede === 'H3') {
        newRoute = [
          locations.H6,
          { latitude: 10.995328, longitude: -74.796315 },
          { latitude: 10.995183, longitude: -74.795849 },
          { latitude: 10.995627, longitude: -74.795068 },
          { latitude: 10.995583, longitude: -74.794835 },
          { latitude: 10.995439, longitude: -74.794589 },
          { latitude: 10.995529, longitude: -74.794361 },
          { latitude: 10.994900, longitude: -74.793641 },
          { latitude: 10.995629, longitude: -74.792918 },
          locations.H3,
        ];
      } else {
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
        toValue: show ? 200 : 140,
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
            strokeColor="#1ABC9C"
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
          color="#1ABC9C" 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.mapTypeButton}
        onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
      >
        <Ionicons 
          name={mapType === 'standard' ? 'map' : 'map-outline'} 
          size={22} 
          color="#1ABC9C" 
        />
      </TouchableOpacity>

      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <View style={styles.panelHandle} />
        
        <View style={styles.routeSelectors}>
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={() => openSedeSelector('origin')}
          >
            <Ionicons name="location" size={18} color="#1ABC9C" />
            <Text style={styles.locationText}>
              {originSede ? sedeNames[originSede] : 'Seleccionar origen'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
            <Ionicons name="swap-vertical" size={20} color="#1ABC9C" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={() => openSedeSelector('destination')}
          >
            <Ionicons name="flag" size={18} color="#1ABC9C" />
            <Text style={styles.locationText}>
              {destinationSede ? sedeNames[destinationSede] : 'Seleccionar destino'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[styles.routeDetails, { opacity: detailsOpacity }]}>
          <View style={styles.routeInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="walk-outline" size={18} color="#1ABC9C" />
              <Text style={styles.infoText}>{calculateDistance() ? `${calculateDistance()} m` : '--'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color="#1ABC9C" />
              <Text style={styles.infoText}>
                {calculateDistance() ? `${Math.ceil(parseInt(calculateDistance() || '0') / 85)} min` : '--'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name={getWeatherIcon()} size={18} color="#1ABC9C" />
              <Text style={styles.infoText}>
                {temperature ? `${temperature.toFixed(1)}°C` : '--'}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {}}
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
                <Ionicons name="close" size={24} color="#1ABC9C" />
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
                  onSelect={selectSede} 
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos
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
    top: 80,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 44,
    height: 44,
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
    top: 130,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 44,
    height: 44,
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
    paddingHorizontal: 30,
    paddingBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  panelHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 10,
    borderRadius: 3,
  },
  routeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  locationSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  locationText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
    flex: 1,
  },
  swapButton: {
    backgroundColor: '#F8F8F8',
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  routeDetails: {
    marginTop: 15,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    color: '#333',
    fontSize: 14,
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
    padding: 12,
    borderRadius: 8,
    flex: 1,
    margin: 5,
  },
  primaryButton: {
    backgroundColor: '#1ABC9C',
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
    paddingBottom: 30,
    minHeight: height * 0.7,
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
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sedeAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
});