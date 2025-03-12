import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";

export type LocationKey = 'H1' | 'H2' | 'H3' | 'H4' | 'H6' | 'H7';
export type Location = { latitude: number; longitude: number };

interface CustomMarkerProps {
  locationKey: LocationKey;
  location: Location;
  title: string;
  description: string;
  isSelected?: boolean;
  onPress?: () => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ 
  locationKey, 
  location, 
  title, 
  description, 
  isSelected = false,
  onPress 
}) => {
  return (
    <Marker
      coordinate={location}
      title={title}
      description={description}
      onPress={onPress}
    >
      <View style={[
        styles.markerContainer,
        isSelected && styles.selectedMarker
      ]}>
        <Ionicons 
          name="location" 
          size={18} 
          color={isSelected ? "#2ecc71" : "#1abc9c"} 
        />
      </View>
      {isSelected && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{title}</Text>
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedMarker: {
    borderColor: '#2ecc71',
    borderWidth: 2,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -40,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 100, // Ancho mínimo para la etiqueta
    maxWidth: 150, // Ancho máximo para la etiqueta
  },
  labelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Centra el texto
  }
});

export default CustomMarker;