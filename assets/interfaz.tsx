import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Polyline } from 'react-native-maps';
import CustomMarker from './markers';
import { LocationKey, Location } from './markers';

interface InterfaceProps {
  originSede: LocationKey | '';
  destinationSede: LocationKey | '';
  locations: Record<LocationKey, Location>;
  sedeNames: Record<LocationKey, string>;
  sedeAddresses: Record<LocationKey, string>;
  animatedRoute: Location[];
  temperature: number | null;
  panelHeight: Animated.Value;
  detailsOpacity: Animated.Value;
  calculateDistance: () => string | null;
  openSedeSelector: (type: 'origin' | 'destination') => void;
}

const Interface: React.FC<InterfaceProps> = ({
  originSede,
  destinationSede,
  locations,
  sedeNames,
  sedeAddresses,
  animatedRoute,
  temperature,
  panelHeight,
  detailsOpacity,
  calculateDistance,
  openSedeSelector
}) => {
  return (
    <>
      {/* Contenedor del mapa */}
      <View style={styles.mapContainerReduced}>
        {/* Marcadores y ruta */}
        {originSede && (
          <CustomMarker
            locationKey={originSede}
            location={locations[originSede]}
            title={sedeNames[originSede]}
            description={sedeAddresses[originSede]}
            isSelected
          />
        )}
        {destinationSede && (
          <CustomMarker
            locationKey={destinationSede}
            location={locations[destinationSede]}
            title={sedeNames[destinationSede]}
            description={sedeAddresses[destinationSede]}
            isSelected
          />
        )}
        {animatedRoute.length > 1 && (
          <Polyline
            coordinates={animatedRoute}
            strokeWidth={4}
            strokeColor="#1ABC9C"
            lineDashPattern={[0]}
          />
        )}
      </View>

      {/* Panel de control */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        {/* Selectores de origen y destino */}
        <View style={styles.routeInputContainer}>
          <TouchableOpacity onPress={() => openSedeSelector('origin')}>
            <Text>{originSede ? sedeNames[originSede] : 'Selecciona origen'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openSedeSelector('destination')}>
            <Text>{destinationSede ? sedeNames[destinationSede] : 'Selecciona destino'}</Text>
          </TouchableOpacity>
        </View>

        {/* Detalles de la ruta */}
        <Animated.View style={[styles.routeDetails, { opacity: detailsOpacity }]}>
          {temperature !== null && (
            <Text>{temperature.toFixed(1)}°C</Text>
          )}
          {calculateDistance() && (
            <Text>{calculateDistance()} m</Text>
          )}
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  mapContainerReduced: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  routeInputContainer: {
    marginBottom: 15,
    gap: 10,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  }
});

export default Interface;