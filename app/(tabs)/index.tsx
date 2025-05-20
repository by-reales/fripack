import React from "react";
import {Animated,Dimensions,TouchableOpacity,View,Text,Modal,TextInput,ScrollView,Alert,Linking,FlatList,PanResponder, BackHandler,} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ExpoLocation from "expo-location";
import CustomMarker, { LocationKey, Location } from "../../assets/markers";
import { useEffect, useRef, useState } from "react";
import * as Network from "expo-network";
import { locations, sedeNames, sedeAddresses, SedeItem } from "../../assets/CustomRoutes";
import { styles } from "../../components/Styles";
import config from '../../Config';
import { calculateRoute } from '../../assets/RouteCalculator';

Dimensions.get("window"); 

interface AnimatedTouchableItemProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

const AnimatedTouchableItem: React.FC<AnimatedTouchableItemProps> = ({
  children,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 1.1, 
      useNativeDriver: true,
      speed: 50,
      bounciness: 30, 
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, 
      useNativeDriver: true,
      speed: 50,
      bounciness: 10, 
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



const mapStyle = [
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }],
  },
];

export default function MapScreen() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [originSede, setOriginSede] = useState<LocationKey | "">("");
  const [destinationSede, setDestinationSede] = useState<LocationKey | "">("");
  const [route, setRoute] = useState<Location[]>([]);
  const [animatedRoute, setAnimatedRoute] = useState<Location[]>([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null); // <- Añadir esto
  const [weather, setWeather] = useState<string | null>(null);
  const [, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<"origin" | "destination">(
    "origin"
  );
  const [sedeSearch, setSedeSearch] = useState("");
  const [, setRouteDetails] = useState(false);
  const panelHeight = useRef(new Animated.Value(140)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [, setLocationPermissionGranted] =
    useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [feelsLike, setFeelsLike] = useState<number | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [selectedGridItem, setSelectedGridItem] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const currentHeightRef = useRef(140);

  useEffect(() => {
    const checkConnection = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setIsConnected(networkState.isConnected ?? false);
      
      if (!networkState.isConnected) {
        Alert.alert(
          "Sin conexión",
          "El mapa y algunos datos no estarán disponibles",
          [{ text: "OK" }]
        );
      }
    };

    checkConnection();
    
    const subscription = Network.addNetworkStateListener((state: Network.NetworkState) => {
      const isConnected = state.isConnected ?? false; 
      setIsConnected(isConnected);
      if (!isConnected) {
        Alert.alert(
          "Conexión perdida", 
          "Funcionalidades limitadas sin internet",
          [{ text: "OK" }]
        );
      }
    });

    return () => subscription.remove();
  }, []);

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
  if (!isConnected) return; 
  try {
    
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new Error("Coordenadas inválidas");
    }

    
    const API_KEY = process.env.EXPO_PUBLIC_UV_API_KEY;

    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json`, {
        params: {
          key: API_KEY,
          q: `${lat},${lon}`
        }
      }
    );

   
    if (!response.data?.current?.uv) {
      throw new Error("Datos UV no disponibles");
    }

    setUvIndex(response.data.current.uv);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error UV:", error.message);
    } else {
      console.error("Error UV:", error);
    }
    Alert.alert("Error", "No se pudo obtener el índice UV");
  }
};

  const getUVDescription = (uvIndex: number | null): string => {
    if (uvIndex === null) return "--";
    if (uvIndex <= 2) return "Bajo";
    if (uvIndex <= 5) return "Moderado";
    if (uvIndex <= 7) return "Alto";
    if (uvIndex <= 10) return "Muy alto";
    return "Extremo";
  };

useEffect(() => {
  (async () => {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "AVISO",
        "Se requieren permisos de ubicación para la navegación",
        [
          {
            text: "OK",
            onPress: () => {
              // Cierra la aplicación
              BackHandler.exitApp();
            }
          }
        ]
      );
      return;
    }

    setLocationPermissionGranted(true);
    getCurrentLocation();
  })();
}, []);

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
        mapRef.current.animateToRegion(
          {
            ...newLocation,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500
        );
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  const centerOnUserLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  useEffect(() => {
  if (originSede && destinationSede) {
    fetchTemperature(locations[originSede].latitude, locations[originSede].longitude);
    fetchUVIndex(locations[originSede].latitude, locations[originSede].longitude);
    
    const now = new Date();
    const currentHour = now.getHours();
    const newRoute = calculateRoute(originSede, destinationSede, currentHour);

    setRoute(newRoute);
    animateRoute(newRoute, setAnimatedRoute);

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
      }),
    ]).start();
  };

  const fetchTemperature = async (lat: number, lon: number) => {
    if (!isConnected) { // NUEVO: Bloqueo sin conexión
      setTemperature(null);
      setWeather(null);
      setHumidity(null);
      setFeelsLike(null);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.WEATHER_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${config.API_KEY}`
      );
      setTemperature(response.data.main.temp);
      setWeather(response.data.weather[0].main);
      setHumidity(response.data.main.humidity);
      setFeelsLike(response.data.main.feels_like);
    } catch (error) {
      setTemperature(null);
      setWeather(null);
      setHumidity(null);
      setFeelsLike(null);
    } finally {
      setLoading(false);
    }
  };

  const interpolatePoints = (
    start: Location,
    end: Location,
    steps: number
  ): Location[] => {
    const points: Location[] = [];
    for (let i = 0; i <= steps; i++) {
      const lat =
        start.latitude + (i / steps) * (end.latitude - start.latitude);
      const lon =
        start.longitude + (i / steps) * (end.longitude - start.longitude);
      points.push({ latitude: lat, longitude: lon });
    }
    return points;
  };

  const animateRoute = (fullRoute: Location[], setAnimatedRoute: React.Dispatch<React.SetStateAction<Location[]>>) => {
    if (!fullRoute || fullRoute.length === 0) return;
    setAnimatedRoute([]);
    let index = 0;

    const animateStep = () => {
      if (index < fullRoute.length - 1) {
        const nextSegment = interpolatePoints(
          fullRoute[index],
          fullRoute[index + 1],
          15
        );
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
    if (!weather) return "cloud-outline";

    switch (weather.toLowerCase()) {
      case "clear":
        return "sunny-outline";
      case "clouds":
        return "cloudy-outline";
      case "rain":
        return "rainy-outline";
      case "thunderstorm":
        return "thunderstorm-outline";
      case "snow":
        return "snow-outline";
      default:
        return "cloud-outline";
    }
  };

  const swapLocations = () => {
    if (originSede && destinationSede) {
      setOriginSede(destinationSede);
      setDestinationSede(originSede);
    }
  };

  const openSedeSelector = (type: "origin" | "destination") => {
    setSelectionType(type);
    setSedeSearch("");
    setModalVisible(true);
  };

  const selectSede = (sede: LocationKey) => {
    if (selectionType === "origin") {
      setOriginSede(sede);
    } else {
      setDestinationSede(sede);
    }
    setModalVisible(false);
  };

  const filteredSedes = Object.keys(locations).filter(
    (sede): sede is LocationKey => {
      const searchTerm = sedeSearch.toLowerCase();
      return (
        sedeNames[sede as LocationKey].toLowerCase().includes(searchTerm) ||
        sede.toLowerCase().includes(searchTerm) ||
        sedeAddresses[sede as LocationKey].toLowerCase().includes(searchTerm)
      );
    }
  );

  const calculateDistance = (): string | null => {
    if (!originSede || !destinationSede) return null;

    const R = 6371; // Radio de la Tierra en km
    const lat1 = locations[originSede].latitude;
    const lon1 = locations[originSede].longitude;
    const lat2 = locations[destinationSede].latitude;
    const lon2 = locations[destinationSede].longitude;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return (distance * 1000).toFixed(0);
  };

  const openGoogleMaps = () => {
    if (!originSede || !destinationSede || route.length === 0) return;

    const waypoints = route
      .slice(1, -1)
      .map((point) => `${point.latitude},${point.longitude}`)
      .join("/");
    const url = `https://www.google.com/maps/dir/${locations[originSede].latitude},${locations[originSede].longitude}/${waypoints}/${locations[destinationSede].latitude},${locations[destinationSede].longitude}`;

    Linking.openURL(url).catch((err) =>
      console.error("No se pudo abrir Google Maps", err)
    );
  };

  const gridData = [
    [
      {
        icon: "walk-outline",
        value: calculateDistance() ? `${calculateDistance()} m` : "--",
        label: "Distancia",
      },
      {
        icon: "time-outline",
        value: calculateDistance()
          ? `${Math.round(Number(calculateDistance()) / 85)} min`
          : "--",
        label: "Tiempo estimado",
      },
      {
        icon: getWeatherIcon(),
        value: temperature ? `${temperature.toFixed(1)}°C` : "--",
        label: "Temperatura",
      },
    ],
    [
      {
        icon: "water-outline",
        value: humidity ? `${humidity}%` : "--",
        label: "Humedad",
      },
      {
        icon: "thermometer-outline",
        value: feelsLike ? `${feelsLike.toFixed(1)}°C` : "--",
        label: "Sensación térmica",
      },
      {
        icon: "sunny-outline",
        value: uvIndex !== null ? `UV: ${uvIndex}` : "UV: --",
        label: uvIndex !== null ? ` ${getUVDescription(uvIndex)}` : "Índice UV", 
      },
    ],
  ];

  return (
    <View style={styles.container}>
      {/* NUEVO: Banner de conexión */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline" size={20} color="white" />
          <Text style={styles.connectionText}>
            Modo offline - Funcionalidades limitadas
          </Text>
        </View>
      )}
  
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
        customMapStyle={mapType === "standard" ? mapStyle : undefined}
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
        <Ionicons name="locate" size={22} color="#2ecc71" />
      </TouchableOpacity>
  
      <TouchableOpacity
        style={styles.mapTypeButton}
        onPress={() =>
          setMapType(mapType === "standard" ? "satellite" : "standard")
        }
      >
        <Ionicons
          name={mapType === "standard" ? "map" : "map-outline"}
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
            onPress={() => openSedeSelector("origin")}
          >
            <Ionicons
              name="location"
              size={18}
              color="#2ecc71"
              style={styles.iconStyle} 
            />
            <Text style={[styles.locationText, styles.textStyle]}>
              {originSede ? sedeNames[originSede] : "Origen"}
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
            <Ionicons name="swap-vertical" size={20} color="#2ecc71" />
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => openSedeSelector("destination")}
          >
            <Ionicons
              name="flag"
              size={18}
              color="#2ecc71"
              style={styles.iconStyle} 
            />
            <Text style={[styles.locationText, styles.textStyle]}>
              {destinationSede ? sedeNames[destinationSede] : "Destino"}
            </Text>
          </TouchableOpacity>
        </View>
  
        <Animated.View
          style={[styles.routeDetails, { opacity: detailsOpacity }]}
        >
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
                    onPress={() =>
                      setSelectedGridItem((prev) =>
                        prev?.row === rowIndex && prev?.col === cardIndex
                          ? null
                          : { row: rowIndex, col: cardIndex }
                      )
                    }
                    accessibilityLabel={`${card.label}: ${card.value}`}
                    accessibilityHint={
                      selectedGridItem?.row === rowIndex &&
                      selectedGridItem?.col === cardIndex
                        ? "Tarjeta seleccionada. Toca para deseleccionar."
                        : "Toca para seleccionar esta tarjeta."
                    }
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.infoCardContent,
                        selectedGridItem?.row === rowIndex &&
                          selectedGridItem?.col === cardIndex &&
                          styles.selectedCard,
                      ]}
                    >
                      <Ionicons
                        name={card.icon as any}
                        size={24}
                        color="#2ecc71"
                        accessible={false} 
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
                Seleccionar {selectionType === "origin" ? "origen" : "destino"}
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
                  onSelect={selectSede}
                  selectionType={"origin"}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
