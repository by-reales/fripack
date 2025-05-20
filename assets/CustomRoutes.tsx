import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../components/Styles";
import { Location, LocationKey } from "./markers";

export const locations: Record<LocationKey, Location> = {
  H1: { latitude: 10.994262, longitude: -74.792331 },
  H2: { latitude: 10.995134, longitude: -74.792289 },
  H3: { latitude: 10.995129, longitude: -74.792534 },
  H4: { latitude: 10.99664, longitude: -74.796771 },
  H6: { latitude: 10.995328, longitude: -74.796315 },
  H7: { latitude: 10.995346, longitude: -74.791502 },
};

export const sedeNames: Record<LocationKey, string> = {
  H1: "Sede 1",
  H2: "Sede 2",
  H3: "Sede 3",
  H4: "Sede Postgrados",
  H6: "Sede 6 Eureka",
  H7: "Casa Blanca",
};

export const sedeAddresses: Record<LocationKey, string> = {
  H1: "Headquarter H1",
  H2: "Headquarter H2",
  H3: "Headquarter H3",
  H4: "Headquarter H4",
  H6: "Headquarter H6",
  H7: "Headquarter H7",
};

export const SedeItem = ({
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
          accessible={false} 
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