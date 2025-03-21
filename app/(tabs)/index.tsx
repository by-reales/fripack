import React, { ReactNode } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Pressable,
  FlatList,
  PanResponder,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ExpoLocation from "expo-location";
import CustomMarker, { LocationKey, Location } from "../../assets/markers";
import { useEffect, useRef, useState } from "react";
import Config from "react-native-config"; // seguridad de la API
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen"; // Responsividad

const UV_API_KEY = Config.UV_API_KEY;

const API_KEY = "01d1e2a2ab57d9ea74d3d44680b5d8d7"; //API para los datos del grid excepto el UV
const { height, width } = Dimensions.get("window"); //Obtiene las dimensiones de la pantalla

//Todo lo que viene ahora maneja la lógica para que los elementos del grid se esaclen ligeramente al presionarlos

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

//hasta aquí llega la logica para que los elementos del grid se esaclen ligeramente al presionarlos

const locations: Record<LocationKey, Location> = {
  H1: { latitude: 10.994262, longitude: -74.792331 },
  H2: { latitude: 10.995134, longitude: -74.792289 },
  H3: { latitude: 10.995129, longitude: -74.792534 },
  H4: { latitude: 10.99664, longitude: -74.796771 },
  H6: { latitude: 10.995328, longitude: -74.796315 },
  H7: { latitude: 10.995346, longitude: -74.791502 },
};

const sedeNames: Record<LocationKey, string> = {
  H1: "Sede 1",
  H2: "Sede 2",
  H3: "Sede 3",
  H4: "Sede Postgrados",
  H6: "Sede 6 Eureka",
  H7: "Casa Blanca",
};

const sedeAddresses: Record<LocationKey, string> = {
  H1: "Headquarter H1",
  H2: "Headquarter H2",
  H3: "Headquarter H3",
  H4: "Headquarter H4",
  H6: "Headquarter H6",
  H7: "Headquarter H7",
};

// Keyla, aquí puedes quitar y agregar elementos del mapa
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

// Key, este es un componente que representa una sede en la lista de selección
const SedeItem = ({
  sede,
  onSelect,
  selectionType,
}: {
  sede: LocationKey;
  onSelect: (sede: LocationKey) => void;
  selectionType: "origin" | "destination";
}) => {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={`${sedeNames[sede]}. ${
        sedeAddresses[sede]
      }. Seleccionar como ${
        selectionType === "origin" ? "punto de partida" : "destino"
      }`}
      accessibilityRole="button"
      accessibilityHint={`Toca para seleccionar ${sedeNames[sede]} como ${
        selectionType === "origin" ? "punto de partida" : "destino"
      }`}
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

// Aquí se calcula la distancia entre dos puntos en la Tierra usando la fórmula del haversine.
const calculateDirectDistance = (
  point1: Location,
  point2: Location
): number => {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distancia en metros
};

// Ahora este es el componente principal que maneja la lógica del mapa, la selección de sedes, la animación de la ruta,
//  y la obtención de datos meteorológicos.

export default function MapScreen() {
  const [originSede, setOriginSede] = useState<LocationKey | "">("");
  const [destinationSede, setDestinationSede] = useState<LocationKey | "">("");
  const [route, setRoute] = useState<Location[]>([]);
  const [animatedRoute, setAnimatedRoute] = useState<Location[]>([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null); // <- Añadir esto
  const [weather, setWeather] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<"origin" | "destination">(
    "origin"
  );
  const [sedeSearch, setSedeSearch] = useState("");
  const [routeDetails, setRouteDetails] = useState(false);
  const panelHeight = useRef(new Animated.Value(140)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [feelsLike, setFeelsLike] = useState<number | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [selectedGridItem, setSelectedGridItem] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const currentHeightRef = useRef(140);

  // en el UseEffect se maneja la altura del panel inferior.

  useEffect(() => {
    const listenerId = panelHeight.addListener(({ value }) => {
      currentHeightRef.current = value;
    });
    return () => panelHeight.removeListener(listenerId);
  }, []);

  // Permite arrastrar el panel inferior para expandirlo o contraerlo.
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

//fetchUVIndex: Obtiene el índice UV de la ubicación actual.

//getUVDescription: Devuelve una descripción del índice UV.

//getCurrentLocation: Obtiene la ubicación actual del usuario.

//centerOnUserLocation: Centra el mapa en la ubicación del usuario.

  const fetchUVIndex = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=1eb5ae58653e491cbeb192832251203&q=${lat},${lon}`
      );
      setUvIndex(response.data.current.uv); // Extrae el índice UV
    } catch (error) {
      console.error("Error obteniendo el índice UV", error);
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

  // Solicitar permisos de ubicación al cargar el componente
  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Error",
          "Se requieren permisos de ubicación para la navegación"
        );
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

  // Función para centrar el mapa en la ubicación del usuario
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

  //Aquí el useEffect calcula la ruta entre las sedes seleccionadas y la anima en el mapa.

  useEffect(() => {
    if (originSede && destinationSede) {
      fetchTemperature(
        locations[originSede].latitude,
        locations[originSede].longitude
      );
      fetchUVIndex(
        locations[originSede].latitude,
        locations[originSede].longitude
      );
      let newRoute: { latitude: number; longitude: number }[] = [];

      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 6 && currentHour < 13) {
        // Rutas de 6:00 AM a 1:00 PM
        if (originSede === "H1" && destinationSede === "H3") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H1") {
          newRoute = [
            locations.H3,
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H6") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994107, longitude: -74.792635 },
            { latitude: 10.994184, longitude: -74.792726 },
            { latitude: 10.9941, longitude: -74.792797 },
            { latitude: 10.994014, longitude: -74.792941 },
            { latitude: 10.995523, longitude: -74.794536 },
            { latitude: 10.995482, longitude: -74.794618 },
            { latitude: 10.995613, longitude: -74.795054 },
            { latitude: 10.995684, longitude: -74.795164 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H1") {
          newRoute = [
            locations.H6,
            { latitude: 10.995537, longitude: -74.796272 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995684, longitude: -74.795164 },
            { latitude: 10.995613, longitude: -74.795054 },
            { latitude: 10.995482, longitude: -74.794618 },
            { latitude: 10.995523, longitude: -74.794536 },
            { latitude: 10.994014, longitude: -74.792941 },
            { latitude: 10.9941, longitude: -74.792797 },
            { latitude: 10.994184, longitude: -74.792726 },
            { latitude: 10.994107, longitude: -74.792635 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H4") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994107, longitude: -74.792635 },
            { latitude: 10.994184, longitude: -74.792726 },
            { latitude: 10.9941, longitude: -74.792797 },
            { latitude: 10.994014, longitude: -74.792941 },
            { latitude: 10.995523, longitude: -74.794536 },
            { latitude: 10.995482, longitude: -74.794618 },
            { latitude: 10.995613, longitude: -74.795054 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H1") {
          newRoute = [
            locations.H4,
            { latitude: 10.995613, longitude: -74.795054 },
            { latitude: 10.995482, longitude: -74.794618 },
            { latitude: 10.995523, longitude: -74.794536 },
            { latitude: 10.994014, longitude: -74.792941 },
            { latitude: 10.9941, longitude: -74.792797 },
            { latitude: 10.994184, longitude: -74.792726 },
            { latitude: 10.994107, longitude: -74.792635 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H2") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.995069, longitude: -74.792379 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H1") {
          newRoute = [
            locations.H2,
            { latitude: 10.995069, longitude: -74.792379 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H2" && destinationSede === "H4") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H2") {
          newRoute = [
            locations.H4,
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H6") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },

            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H2") {
          newRoute = [
            locations.H6,
            { latitude: 10.995537, longitude: -74.796272 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H7" && destinationSede === "H6") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },

            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H7") {
          newRoute = [
            locations.H6,
            { latitude: 10.995537, longitude: -74.796272 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H1") {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H7") {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H3") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H7") {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H2") {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H7") {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H4") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H7") {
          newRoute = [
            locations.H4,
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995439, longitude: -74.794589 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H3" && destinationSede === "H4") {
          newRoute = [
            locations.H3,
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995444, longitude: -74.794625 },
            { latitude: 10.995627, longitude: -74.795068 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H3") {
          newRoute = [
            locations.H4,
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995444, longitude: -74.794625 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            locations.H3,
          ];
        } else if (originSede === "H4" && destinationSede === "H6") {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826 },
            { latitude: 10.995516, longitude: -74.79625 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H4") {
          newRoute = [
            locations.H6,
            { latitude: 10.995516, longitude: -74.79625 },
            { latitude: 10.995308, longitude: -74.795826 },
            { latitude: 10.995682, longitude: -74.795133 },
            locations.H4,
          ];
        } else if (originSede === "H3" && destinationSede === "H6") {
          newRoute = [
            locations.H3,
            { latitude: 10.995629, longitude: -74.792918 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.995444, longitude: -74.794625 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995537, longitude: -74.796272 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H3") {
          newRoute = [
            locations.H6,
            { latitude: 10.995537, longitude: -74.796272 },
            { latitude: 10.9953, longitude: -74.795821 },
            { latitude: 10.995681, longitude: -74.795196 },
            { latitude: 10.995627, longitude: -74.795068 },
            { latitude: 10.995583, longitude: -74.794835 },
            { latitude: 10.995444, longitude: -74.794625 },
            { latitude: 10.995531, longitude: -74.794467 },
            { latitude: 10.99481, longitude: -74.793729 },
            { latitude: 10.9949, longitude: -74.793641 },
            { latitude: 10.995629, longitude: -74.792918 },
            locations.H3,
          ];
        }
      } else if (currentHour >= 13 && currentHour < 14) {
        // Rutas de 1:00 PM a 2:00 PM
        if (originSede === "H1" && destinationSede === "H3") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H1") {
          newRoute = [
            locations.H3,
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H7" && destinationSede === "H1") {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H7") {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H3") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H7") {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H2") {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H7") {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H7,
          ];
        } else if (originSede === "H1" && destinationSede === "H2") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.995069, longitude: -74.792379 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H1") {
          newRoute = [
            locations.H2,
            { latitude: 10.995069, longitude: -74.792379 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H6") {
          newRoute = [
            locations.H1,
            { latitude: 10.994381, longitude: -74.79235 },
            { latitude: 10.994108, longitude: -74.792638 },
            { latitude: 10.994179, longitude: -74.792719 },
            { latitude: 10.9941, longitude: -74.792807 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995475, longitude: -74.796161 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H1") {
          newRoute = [
            locations.H6,
            { latitude: 10.995475, longitude: -74.796161 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.9941, longitude: -74.792807 },
            { latitude: 10.994179, longitude: -74.792719 },
            { latitude: 10.994108, longitude: -74.792638 },
            { latitude: 10.994381, longitude: -74.79235 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H4") {
          newRoute = [
            locations.H1,
            { latitude: 10.994381, longitude: -74.79235 },
            { latitude: 10.994108, longitude: -74.792638 },
            { latitude: 10.994179, longitude: -74.792719 },
            { latitude: 10.9941, longitude: -74.792807 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H1") {
          newRoute = [
            locations.H4,
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.9941, longitude: -74.792807 },
            { latitude: 10.994179, longitude: -74.792719 },
            { latitude: 10.994108, longitude: -74.792638 },
            { latitude: 10.994381, longitude: -74.79235 },
            locations.H1,
          ];
        } else if (originSede === "H4" && destinationSede === "H6") {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826 },
            { latitude: 10.995516, longitude: -74.79625 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H4") {
          newRoute = [
            locations.H6,
            { latitude: 10.995516, longitude: -74.79625 },
            { latitude: 10.995308, longitude: -74.795826 },
            { latitude: 10.995682, longitude: -74.795133 },
            locations.H4,
          ];
        } else if (originSede === "H2" && destinationSede === "H6") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995475, longitude: -74.796161 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H2") {
          newRoute = [
            locations.H6,
            { latitude: 10.995475, longitude: -74.796161 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H7" && destinationSede === "H6") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995475, longitude: -74.796161 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H7") {
          newRoute = [
            locations.H6,
            { latitude: 10.995475, longitude: -74.796161 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H4") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H7") {
          newRoute = [
            locations.H4,
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H2" && destinationSede === "H4") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H2") {
          newRoute = [
            locations.H4,
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H3" && destinationSede === "H4") {
          newRoute = [
            locations.H3,
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H3") {
          newRoute = [
            locations.H4,
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H6") {
          newRoute = [
            locations.H3,
            { latitude: 10.995618, longitude: -74.792937 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995475, longitude: -74.796161 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H3") {
          newRoute = [
            locations.H6,
            { latitude: 10.995475, longitude: -74.796161 },
            { latitude: 10.995278, longitude: -74.795805 },
            { latitude: 10.995665, longitude: -74.795144 },
            { latitude: 10.995562, longitude: -74.795032 },
            { latitude: 10.995615, longitude: -74.79478 },
            { latitude: 10.99548, longitude: -74.7946 },
            { latitude: 10.995607, longitude: -74.794399 },
            { latitude: 10.994914, longitude: -74.793654 },
            { latitude: 10.995618, longitude: -74.792937 },
            locations.H3,
          ];
        }
      } else {
        // Rutas de 2:00 PM a 6:00 AM
        if (originSede === "H1" && destinationSede === "H3") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H1") {
          newRoute = [
            locations.H3,
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H7" && destinationSede === "H1") {
          newRoute = [
            locations.H7,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H1,
          ];
        } else if (originSede === "H1" && destinationSede === "H7") {
          newRoute = [
            locations.H1,
            { latitude: 10.994283, longitude: -74.792419 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H3") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H7") {
          newRoute = [
            locations.H3,
            { latitude: 10.994794, longitude: -74.792063 },
            locations.H7,
          ];
        } else if (originSede === "H7" && destinationSede === "H2") {
          newRoute = [
            locations.H7,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H7") {
          newRoute = [
            locations.H2,
            { latitude: 10.994854, longitude: -74.791991 },
            locations.H7,
          ];
        } else if (originSede === "H1" && destinationSede === "H6") {
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
            { latitude: 10.99556, longitude: -74.79629 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H1") {
          newRoute = [
            locations.H6,
            { latitude: 10.99556, longitude: -74.79629 },
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
        } else if (originSede === "H1" && destinationSede === "H4") {
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
        } else if (originSede === "H4" && destinationSede === "H1") {
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
        } else if (originSede === "H1" && destinationSede === "H2") {
          newRoute = [
            locations.H1,
            { latitude: 10.994417, longitude: -74.792333 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.995069, longitude: -74.792379 },
            locations.H2,
          ];
        } else if (originSede === "H2" && destinationSede === "H4") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.994975, longitude: -74.793551 },
            { latitude: 10.994892, longitude: -74.793631 },
            { latitude: 10.995079, longitude: -74.793834 },
            { latitude: 10.994898, longitude: -74.794025 },
            { latitude: 10.995521, longitude: -74.794663 },
            { latitude: 10.995618, longitude: -74.794968 },
            { latitude: 10.995568, longitude: -74.795071 },
            { latitude: 10.995729, longitude: -74.795229 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H2") {
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
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H7" && destinationSede === "H4") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
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
            { latitude: 10.996617, longitude: -74.79672 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H7") {
          newRoute = [
            locations.H4,
            { latitude: 10.996617, longitude: -74.79672 },
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
        } else if (originSede === "H7" && destinationSede === "H6") {
          newRoute = [
            locations.H7,
            { latitude: 10.994794, longitude: -74.792063 },
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
            { latitude: 10.9953, longitude: -74.795833 },
            { latitude: 10.995469, longitude: -74.79616 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H7") {
          newRoute = [
            locations.H6,
            { latitude: 10.995469, longitude: -74.79616 },
            { latitude: 10.9953, longitude: -74.795833 },
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
        } else if (originSede === "H2" && destinationSede === "H6") {
          newRoute = [
            locations.H2,
            { latitude: 10.995129, longitude: -74.792534 },
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.994975, longitude: -74.793551 },
            { latitude: 10.994892, longitude: -74.793631 },
            { latitude: 10.995079, longitude: -74.793834 },
            { latitude: 10.994898, longitude: -74.794025 },
            { latitude: 10.995521, longitude: -74.794663 },
            { latitude: 10.995618, longitude: -74.794968 },
            { latitude: 10.995568, longitude: -74.795071 },
            { latitude: 10.995729, longitude: -74.795229 },
            { latitude: 10.995295, longitude: -74.795802 },
            { latitude: 10.995527, longitude: -74.796239 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H2") {
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
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.995129, longitude: -74.792534 },
            locations.H2,
          ];
        } else if (originSede === "H3" && destinationSede === "H4") {
          newRoute = [
            locations.H3,
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.994975, longitude: -74.793551 },
            { latitude: 10.994892, longitude: -74.793631 },
            { latitude: 10.995079, longitude: -74.793834 },
            { latitude: 10.994898, longitude: -74.794025 },
            { latitude: 10.995521, longitude: -74.794663 },
            { latitude: 10.995618, longitude: -74.794968 },
            { latitude: 10.995568, longitude: -74.795071 },
            { latitude: 10.995729, longitude: -74.795229 },
            locations.H4,
          ];
        } else if (originSede === "H4" && destinationSede === "H3") {
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
            { latitude: 10.995609, longitude: -74.79292 },
            locations.H3,
          ];
        } else if (originSede === "H3" && destinationSede === "H6") {
          newRoute = [
            locations.H3,
            { latitude: 10.995609, longitude: -74.79292 },
            { latitude: 10.994975, longitude: -74.793551 },
            { latitude: 10.994892, longitude: -74.793631 },
            { latitude: 10.995079, longitude: -74.793834 },
            { latitude: 10.994898, longitude: -74.794025 },
            { latitude: 10.995521, longitude: -74.794663 },
            { latitude: 10.995618, longitude: -74.794968 },
            { latitude: 10.995568, longitude: -74.795071 },
            { latitude: 10.995729, longitude: -74.795229 },
            { latitude: 10.995295, longitude: -74.795802 },
            { latitude: 10.995527, longitude: -74.796239 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H3") {
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
            { latitude: 10.995609, longitude: -74.79292 },
            locations.H3,
          ];
        } else if (originSede === "H2" && destinationSede === "H1") {
          newRoute = [
            locations.H2,
            { latitude: 10.995069, longitude: -74.792379 },
            { latitude: 10.994714, longitude: -74.792065 },
            { latitude: 10.994417, longitude: -74.792333 },
            locations.H1,
          ];
        } else if (originSede === "H4" && destinationSede === "H6") {
          newRoute = [
            locations.H4,
            { latitude: 10.995682, longitude: -74.795133 },
            { latitude: 10.995308, longitude: -74.795826 },
            { latitude: 10.995516, longitude: -74.79625 },
            locations.H6,
          ];
        } else if (originSede === "H6" && destinationSede === "H4") {
          newRoute = [
            locations.H6,
            { latitude: 10.995516, longitude: -74.79625 },
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
      }),
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
      console.error("Error obteniendo la temperatura", error);
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

  const animateRoute = (fullRoute: Location[]) => {
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

// hasta aquí se hace todo esto:

//toggleRouteDetails: Muestra u oculta los detalles de la ruta.

//fetchTemperature: Obtiene la temperatura y el clima de la ubicación actual.

//interpolatePoints: Interpola puntos entre dos ubicaciones para animar la ruta.

//animateRoute: Anima la ruta en el mapa.

//getWeatherIcon: Devuelve un ícono basado en el clima actual.



//AHORA se hace esto:

//swapLocations: Intercambia las sedes de origen y destino.

//openSedeSelector: Abre el modal para seleccionar una sede.

//selectSede: Selecciona una sede como origen o destino.

//filteredSedes: Filtra las sedes basadas en la búsqueda.

//calculateDistance: Calcula la distancia entre dos sedes.

//openGoogleMaps: Abre Google Maps con la ruta predefinida.

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

  // Función para abrir Google Maps con la ruta predefinida
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

  //gridData: Datos para mostrar en la cuadrícula de información.
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
        label: uvIndex !== null ? ` ${getUVDescription(uvIndex)}` : "Índice UV", // Aquí se añade "UV" antes de la descripción
      },
    ],
  ];

//MapView: Muestra el mapa con los marcadores y la ruta animada.

//TouchableOpacity: Botones para centrar la ubicación y cambiar el tipo de mapa.

//Animated.View: Panel inferior que muestra los detalles de la ruta y la información meteorológica.

//Modal: Modal para seleccionar la sede de origen o destino.

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
              style={styles.iconStyle} // Aplicar estilo al ícono
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
              style={styles.iconStyle} // Aplicar estilo al ícono
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

const styles = StyleSheet.create({
  container: { // Estilo del contenedor principal
    flex: 1, //flex: 1: Hace que el contenedor ocupe todo el espacio disponible en la pantalla.
    backgroundColor: "#F5F5F5", //backgroundColor: "#F5F5F5": Define el color de fondo del contenedor principal como un gris claro.
  },

  map: { // Estilo del mapa
    ...StyleSheet.absoluteFillObject, //...StyleSheet.absoluteFillObject: Hace que el mapa ocupe todo el espacio disponible.
  },

  locationButton: { // Estilo del botón para centrar la ubicación
    position: "absolute", //position: "absolute": Posiciona el botón de manera absoluta en la pantalla.
    top: hp("10%"), //top: hp("10%"): Coloca el botón a un 10% de la parte superior de la pantalla.
    right: wp("4%"), //right: wp("4%"): Coloca el botón a un 4% del borde derecho de la pantalla.
    backgroundColor: "white", //backgroundColor: "white": Fondo blanco para el botón.
    borderRadius: 30, //borderRadius: 30: Hace que el botón sea circular.
    width: wp("12%"), //width: wp("12%") y height: wp("12%"): Define el tamaño del botón como un 12% del ancho de la pantalla.
    height: wp("12%"), //width: wp("12%") y height: wp("12%"): Define el tamaño del botón como un 12% del ancho de la pantalla.
    justifyContent: "center", //justifyContent: "center" y alignItems: "center": Centra el ícono dentro del botón.
    alignItems: "center", //justifyContent: "center" y alignItems: "center": Centra el ícono dentro del botón.
    shadowColor: "#000", //shadowColor, shadowOffset, shadowOpacity, shadowRadius: Añade una sombra al botón.
    shadowOffset: { width: 0, height: 2 }, //shadowColor, shadowOffset, shadowOpacity, shadowRadius: Añade una sombra al botón.
    shadowOpacity: 0.2, 
    shadowRadius: 3,
    elevation: 4, //elevation: 4: Añade una elevación (sombra) en Android.
  },

  mapTypeButton: { // Estilo del botón para cambiar el tipo de mapa
    position: "absolute", //position: "absolute": Posiciona el botón de manera absoluta en la pantalla.
    top: hp("18%"), //top: hp("18%"): Coloca el botón a un 18% de la parte superior de la pantalla.
    right: wp("4%"), //right: wp("4%"): Coloca el botón a un 4% del borde derecho de la pantalla.
    backgroundColor: "white", //backgroundColor: "white": Fondo blanco para el botón.
    borderRadius: 30, //borderRadius: 30: Hace que el botón sea circular.
    width: wp("12%"), //width: wp("12%") y height: wp("12%"): Define el tamaño del botón como un 12% del ancho de la pantalla.
    height: wp("12%"), //width: wp("12%") y height: wp("12%"): Define el tamaño del botón como un 12% del ancho de la pantalla.
    justifyContent: "center", //justifyContent: "center" y alignItems: "center": Centra el ícono dentro del botón.
    alignItems: "center", //justifyContent: "center" y alignItems: "center": Centra el ícono dentro del botón.
    shadowColor: "#000", //shadowColor, shadowOffset, shadowOpacity, shadowRadius: Añade una sombra al botón.
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4, //elevation: 4: Añade una elevación (sombra) en Android.
  },
  panel: { // Estilo del panel de detalles de la ruta
    position: "absolute", // Posiciona el panel de detalles de la ruta de manera absoluta en la pantalla.
    bottom: 0, // Coloca el panel en la parte inferior de la pantalla.
    left: 0, // Coloca el panel en la parte izquierda de la pantalla.
    right: 0, // Coloca el panel en la parte derecha de la pantalla.
    backgroundColor: "white", // Fondo blanco para el panel.
    borderTopLeftRadius: 20, // Esquinas redondeadas en la parte superior izquierda.
    borderTopRightRadius: 20, // Esquinas redondeadas en la parte superior derecha.
    paddingHorizontal: wp("5%"), // Añade un relleno horizontal del 5% del ancho de la pantalla.
    paddingBottom: hp("7%"), // Añade un relleno inferior del 7% de la altura de la pantalla.
    shadowColor: "#000", // Añade una sombra al panel.
    shadowOffset: { width: 0, height: -8 }, // Añade una sombra al panel.
    shadowOpacity: 0.15, // Añade una sombra al panel.
    shadowRadius: 8, // Añade una sombra al panel.
    elevation: 12, // Añade una elevación (sombra) en Android.
    zIndex: 10, // Añade una elevación (sombra) en Android.
    height: hp("40%"), // 40% de la altura
  },
  panelHandle: { // Estilo del manejador del panel
    width: "100%", // Asegura que el manejador ocupe todo el ancho disponible.
    alignItems: "center", // Centra el manejador horizontalmente.
    paddingVertical: 5, // Añade un relleno vertical de 5 píxeles.
  },
  iconStyle: { // Estilo del ícono
    marginRight: 2, // Espacio entre el ícono y el texto
  },
  textStyle: { // Estilo del texto
    marginLeft: 2, // Espacio entre el ícono y el texto (alternativa)
  },

  routeSelectors: { // Estilo de los selectores de origen y destino
    flexDirection: "row", // Alinea los selectores de origen y destino en una fila.
    alignItems: "center", // Centra los elementos verticalmente.
    paddingHorizontal: 12, // Añade un relleno horizontal de 12 píxeles.
    marginVertical: 12, // Añade un margen vertical de 12 píxeles.
  },
  locationSelector: { // Estilo del selector de ubicación
    flex: 1, // Asegura que los selectores de origen y destino ocupen el mismo ancho.
    flexDirection: "row", // Alinea el ícono y el texto en una fila.
    alignItems: "center", // Centra los elementos verticalmente.
    justifyContent: "center", // Centra los elementos horizontalmente.
    backgroundColor: "#F8F8F8", // Fondo gris claro para los selectores.
    padding: 12, // Añade un relleno de 12 píxeles.
    borderRadius: 10, // Esquinas redondeadas de 10 píxeles.
    marginHorizontal: -14, // Añade un margen horizontal de -14 píxeles.
  },
  locationText: { // Estilo del texto de la ubicación
    fontSize: 14, // Tamaño de fuente de 14 píxeles.
    color: "#2d3436", // Color de texto oscuro.
    fontWeight: "500", // Peso de fuente seminegrita.
    textAlign: "center", // Centrar el texto
  },
  swapButton: {
    marginHorizontal: 18, // Añade un margen horizontal de 18 píxeles.
    zIndex: 1, // Añade una elevación (sombra) en Android.
  },
  swapButtonInner: { // Estilo del botón de intercambio
    backgroundColor: "#2ecc71", // Fondo verde para el botón de intercambio.
    width: 40, // Ancho de 40 píxeles.
    height: 40, // Alto de 40 píxeles.
    borderRadius: 20, // Hace que el botón sea circular.
    justifyContent: "center", // Centra el ícono verticalmente.
    alignItems: "center", // Centra el ícono horizontalmente.
    elevation: 2, // Añade una elevación (sombra) en Android.
    shadowColor: "#000", // Añade una sombra al botón de intercambio.
    shadowOffset: { width: 0, height: 2 }, // Añade una sombra al botón de intercambio.
    shadowOpacity: 0.1, // Añade una sombra al botón de intercambio.
    shadowRadius: 4, // Añade una sombra al botón de intercambio.
  },
  routeDetails: { // Estilo de los detalles de la ruta
    marginTop: -1, // Añade un margen superior de -1 píxel.
    paddingHorizontal: 0, // Añade un relleno horizontal de 0 píxeles.
  },
  routeInfo: { // Estilo de la cuadrícula de información
    justifyContent: "space-between", // Distribuye el espacio entre las tarjetas
  },
  routeInfoGrid: {
    padding: 0, // Añade un relleno de 0 píxeles. 
  },
  routeInfoContainer: { // Estilo del contenedor de información
    backgroundColor: "white", // Fondo blanco para la cuadrícula de información.
    borderRadius: 16, // Esquinas redondeadas de 16 píxeles.
    marginHorizontal: 16, // Añade un margen horizontal de 16 píxeles.
    marginVertical: 8, // Añade un margen vertical de 8 píxeles.
    elevation: 3, // Añade una elevación (sombra) en Android.
    shadowColor: "#000", // Añade una sombra a la cuadrícula de información.
    shadowOffset: { width: 0, height: 2 }, // Añade una sombra a la cuadrícula de información.
    shadowOpacity: 0.1, // Añade una sombra a la cuadrícula de información.
    shadowRadius: 6, // Añade una sombra a la cuadrícula de información.
  },
  infoRow: { // Estilo de la fila de información
    flexDirection: "row", // Alinea las tarjetas de información en una fila.
    justifyContent: "space-between", // Distribuye el espacio entre las tarjetas
    marginBottom: 16, // Añade un margen inferior de 16 píxeles.
    paddingHorizontal: 0, // Añade un relleno horizontal de 0 píxeles.
    width: "100%", // Asegura que la fila ocupe todo el ancho disponible
    overflow: "visible", // Añadido
  },
  infoItem: { // Estilo de la tarjeta de información
    flexDirection: "row", // Alinea el ícono y el texto en una fila.
    alignItems: "center", // Centra los elementos verticalmente.
  },
  infoText: { // Estilo del texto de información
    marginLeft: 5, // Añade un margen izquierdo de 5 píxeles.
    color: "#333", // Color de texto oscuro.
    fontSize: 14, // Tamaño de fuente de 14 píxeles.
  },
  infoCard: { // Estilo de la tarjeta de información
    flex: 1, // Ocupa todo el espacio disponible
    backgroundColor: "#f8f9fa", // Fondo gris claro
    borderRadius: 12, // Esquinas redondeadas de 12 píxeles
    padding: 14, // Añade un relleno de 14 píxeles
    alignItems: "center", // Centra los elementos horizontalmente
    justifyContent: "center", // Centra los elementos verticalmente
    gap: 0, // Añadido
    position: "relative", // Añadido
    overflow: "visible", // Cambiado de 'hidden'
    aspectRatio: 1, // Añadido
  },
  infoValue: { // Estilo del valor de la información
    fontSize: 16, // Tamaño de fuente de 16 píxeles
    fontWeight: "600", // Peso de fuente seminegrita
    color: "#2d3436", // Color de texto oscuro
  },
  infoLabel: { // Estilo de la etiqueta de información
    fontSize: 12, // Tamaño de fuente de 12 píxeles
    color: "#636e72", // Color de texto gris
    textAlign: "center", // Centrar el texto
    lineHeight: 14, // Altura de línea de 14 píxeles
  },
  actionButtons: { // Estilo de los botones de acción
    flexDirection: "row", // Alinea los botones en una fila
    justifyContent: "space-between", // Distribuye el espacio entre los botones
  },
  actionButton: { // Estilo del botón de acción
    flexDirection: "row", // Alinea el ícono y el texto en una fila
    alignItems: "center", // Centra los elementos verticalmente
    justifyContent: "center", // Centra los elementos horizontalmente
    backgroundColor: "#F8F8F8", // Fondo gris claro para los botones
    padding: 6, // Añade un relleno de 6 píxeles
    borderRadius: 10, // Esquinas redondeadas de 10 píxeles
    flex: 1, // Ocupa todo el espacio disponible
    margin: 0, // Añade un margen de 0 píxeles
  },
  primaryButton: { // Estilo del botón principal
    backgroundColor: "#2ecc71", // Fondo verde para el botón principal
  },
  buttonText: { // Estilo del texto del botón
    marginLeft: 8, // Añade un margen izquierdo de 8 píxeles
    color: "#FFF", // Color de texto blanco
    fontSize: 14, // Tamaño de fuente de 14 píxeles
    fontWeight: "500", // Peso de fuente seminegrita
  },
  modalContainer: { // Estilo del contenedor del modal
    flex: 1, // Ocupa todo el espacio disponible
    justifyContent: "flex-end", // Alinea el contenido en la parte inferior
    backgroundColor: "rgba(0,0,0,0.5)", // Fondo semitransparente
  },
  modalContent: { // Estilo del contenido del modal
    backgroundColor: "white", // Fondo blanco para el contenido del modal
    borderTopLeftRadius: 20, // Esquinas redondeadas en la parte superior izquierda
    borderTopRightRadius: 20, // Esquinas redondeadas en la parte superior derecha
    paddingHorizontal: 20, // Añade un relleno horizontal de 20 píxeles
    paddingBottom: 0, // Añade un relleno inferior de 0 píxeles
    minHeight: hp("70%"), // 70% de la altura
  },
  modalHeader: { // Estilo del encabezado del modal
    flexDirection: "row", // Alinea los elementos en una fila
    justifyContent: "space-between", // Distribuye el espacio entre los elementos
    alignItems: "center", // Centra los elementos verticalmente
    paddingVertical: 15, // Añade un relleno vertical de 15 píxeles
  },
  modalTitle: { // Estilo del título del modal
    fontSize: 18, // Tamaño de fuente de 18 píxeles
    fontWeight: "bold", // Peso de fuente en negrita
    color: "#333", // Color de texto oscuro
    textAlign: "center", // Centrar el texto
    flex: 1, // Ocupa todo el espacio disponible
  },
  searchContainer: { // Estilo del contenedor de búsqueda
    flexDirection: "row", // Alinea los elementos en una fila
    alignItems: "center", // Centra los elementos verticalmente
    backgroundColor: "#F5F5F5", // Fondo gris claro para el contenedor de búsqueda
    paddingHorizontal: 15, // Añade un relleno horizontal de 15 píxeles
    borderRadius: 10, // Esquinas redondeadas de 10 píxeles
    marginBottom: 15, // Añade un margen inferior de 15 píxeles
  },
  searchInput: { // Estilo del campo de búsqueda
    flex: 1, // Ocupa todo el espacio disponible
    paddingVertical: 10, // Añade un relleno vertical de 10 píxeles
    marginLeft: 10, // Añade un margen izquierdo de 10 píxeles
  },
  sedeList: { // Estilo de la lista de sedes
    flex: 1, // Ocupa todo el espacio disponible
  },
  sedeItem: { // Estilo de cada elemento de la lista de sedes
    flexDirection: "row", // Alinea los elementos en una fila
    padding: 15, // Añade un relleno de 15 píxeles
    borderBottomWidth: 1, // Añade un borde inferior de 1 píxel
    borderBottomColor: "#F0F0F0", // Color de borde gris claro
  },
  sedeIconContainer: { // Contenedor del ícono de la sede
    marginRight: 12, // Añade un margen derecho de 12 píxeles
  },
  sedeInfoContainer: { // Contenedor de información de la sede
    flex: 1, // Ocupa todo el espacio disponible
  },
  sedeName: { // Estilo del nombre de la sede
    fontSize: hp("2%"), // Antes: 16
    color: "#333", // Color de texto oscuro
    fontWeight: "500", // Peso de fuente seminegrita
  },
  sedeAddress: { // Estilo de la dirección de la sede
    fontSize: hp("1.8%"), // Antes: 14
    color: "#666", // Color de texto gris
    marginTop: hp("0.5%"), // Antes: 4
  },
  selectorContent: { // Estilo del contenido del selector
    flexDirection: "row", // Alinea los elementos en una fila
    alignItems: "center", // Centra los elementos verticalmente
    gap: 8, // Añade un espacio entre los elementos
  },
  currentLocationMarker: { // Estilo del marcador de ubicación actual
    alignItems: "center", // Centra los elementos horizontalmente
    justifyContent: "center", // Centra los elementos verticalmente
  },
  currentLocationDot: { // Estilo del punto de ubicación actual
    width: 14, // Ancho de 14 píxeles
    height: 14, // Alto de 14 píxeles
    borderRadius: 7, // Hace que el punto sea circular
    backgroundColor: "#4285F4", // Color azul para el punto
    borderWidth: 3, // Añade un borde de 3 píxeles
    borderColor: "white", // Color de borde blanco
    zIndex: 2, // Añade una elevación (sombra) en Android
  },
  currentLocationPulse: { // Estilo del pulso de ubicación actual
    position: "absolute", // Posiciona el pulso de manera absoluta
    width: 30, // Ancho de 30 píxeles
    height: 30, // Alto de 30 píxeles
    borderRadius: 15, // Hace que el pulso sea circular
    backgroundColor: "rgba(66, 133, 244, 0.3)", // Color azul semitransparente
    zIndex: 1, 
  },
  placeholderText: {
    color: "#a4b0be",
    fontStyle: "italic",
  },
  infoCardContent: {
    alignItems: "center", //alignItems: "center" y justifyContent: "center": Centra el contenido.
    justifyContent: "center",
    width: "125%", //"125%" y height: "130%": Aumenta el tamaño del contenido.
    height: "130%", // Ocupa todo el espacio del contenedor padre
  },
  selectedCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8, // Aumentar el radio de borde // Hacer el borde más grueso
    borderColor: "#2ecc71",
    padding: 0, // Aumentar el espacio interno
    // Añadir sombra para mayor profundidad
    shadowColor: "#2ecc71", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 999, // Añadido para superposición
  },

  panelHandleBar: {
    width: 50, //width: 50 y height: 6: Define el tamaño de la barra del manejador.
    height: 6, 
    backgroundColor: "#E0E0E0", //#E0E0E0": Color de fondo gris claro.
    borderRadius: 2, //Redondea las esquinas de la barra.
  },
});

function setCustomDimensions(arg0: { width: number; height: number }) {
  throw new Error("Function not implemented."); 
}
