import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import Animated, { FadeIn, FadeInRight, FadeInUp } from 'react-native-reanimated';
const API_KEY = '1eb5ae58653e491cbeb192832251203'; // Key de weatherapi.com
const { width } = Dimensions.get('window');

interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  hour: {
    time: string;
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    chance_of_rain: number;
  }[];
}

interface CurrentWeather {
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  uv: number;
  condition: {
    text: string;
    icon: string;
  };
}

export default function WeatherForecastScreen() {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=Barranquilla&days=7&aqi=no&alerts=no`
        );
        
        setCurrent(response.data.current);
        setForecast(response.data.forecast.forecastday);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Sunny': 'sunny',               // Soleado
      'Clear': 'moon',                // Despejado
      'Cloudy': 'cloud',              // Nublado
      'Overcast': 'cloudy',           // Cubierto
      'Rain': 'rainy',                // Lluvia
      'Thunderstorm': 'thunderstorm', // Tormenta
      'Partly cloudy': 'partly-sunny', // Parcialmente nublado
      'Light rain': 'rainy-outline',  // Lluvia ligera
      'Moderate rain': 'rainy',       // Lluvia moderada
      'Heavy rain': 'rainy',          // Lluvia intensa
      'Patchy rain possible': 'rainy-outline', // Posible lluvia dispersa
      'Mist': 'cloudy',               // Neblina
      'Fog': 'cloudy',                // Niebla
      'Snow': 'snow',                 // Nieve
      'Hail': 'snow',                 // Granizo
    };
    
    return iconMap[condition] || 'cloud-outline'; // Ícono por defecto si no se encuentra
  };

  const translateCondition = (condition: string): string => {
    const conditionMap: { [key: string]: string } = {
      'Sunny': 'Soleado',
      'Clear': 'Despejado',
      'Cloudy': 'Nublado',
      'Overcast': 'Cubierto',
      'Rain': 'Lluvia',
      'Thunderstorm': 'Tormenta',
      'Partly cloudy': 'Parcialmente nublado',
      'Light rain': 'Lluvia ligera',
      'Moderate rain': 'Lluvia moderada',
      'Heavy rain': 'Lluvia intensa',
      'Patchy rain possible': 'Posible lluvia dispersa',
      'Mist': 'Neblina',
      'Fog': 'Niebla',
      'Snow': 'Nieve',
      'Hail': 'Granizo',
    };
    
    return conditionMap[condition] || condition; // Si no se encuentra, devuelve la condición original
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { weekday: 'long' }).split(',')[0];
  };

  const formatHour = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Encabezado con clima actual */}
        <Animated.View 
          entering={FadeIn.delay(200).duration(800)}
          style={styles.currentWeatherCard}
        >
          <Text style={styles.locationTitle}>Barranquilla</Text>
          <View style={styles.currentWeatherHeader}>
            <Ionicons 
              name={getWeatherIcon(current?.condition.text || '')} 
              size={80} 
              color="#2ecc71" 
            />
            <View>
              <Text style={styles.temperatureText}>
                {current?.temp_c.toFixed(0)}°
              </Text>
              <Text style={styles.conditionText}>
                {translateCondition(current?.condition.text || '')}
              </Text>
            </View>
          </View>
          
          {/* Grid de detalles */}
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="thermometer" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>
                Sensación {current?.feelslike_c.toFixed(0)}°
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>
                {current?.humidity}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>
                {current?.wind_kph} km/h
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="sunny" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>
                UV {current?.uv}
              </Text>
            </View>
          </View>
        </Animated.View>
  
        {/* Pronóstico por horas */}
        <Animated.Text 
          entering={FadeInRight.delay(400)}
          style={styles.sectionTitle}
        >
          Pronóstico por horas
        </Animated.Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyForecastContainer}
        >
          {forecast[0]?.hour.map((hour, index) => (
            <Animated.View 
              entering={FadeInUp.delay(200 + index * 100).springify()}
              key={hour.time}
              style={styles.hourlyForecastCard}
            >
              <Text style={styles.hourlyForecastTime}>
                {formatHour(hour.time)}
              </Text>
              <Ionicons 
                name={getWeatherIcon(hour.condition.text)} 
                size={30} 
                color="#2ecc71" 
              />
              <Text style={styles.hourlyForecastTemp}>
                {hour.temp_c.toFixed(0)}°
              </Text>
              <Text style={styles.hourlyForecastRain}>
                ☔ {hour.chance_of_rain}%
              </Text>
            </Animated.View>
          ))}
        </ScrollView>
  
        {/* Pronóstico semanal */}
        <Animated.Text 
          entering={FadeInRight.delay(400)}
          style={styles.sectionTitle}
        >
          Pronóstico 3 días
        </Animated.Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastContainer}
        >
          {forecast.map((day, index) => (
            <Animated.View 
              entering={FadeInUp.delay(200 + index * 100).springify()}
              key={day.date}
              style={styles.forecastCard}
            >
              <Text style={styles.forecastDay}>
                {formatDate(day.date)}
              </Text>
              <Ionicons 
                name={getWeatherIcon(day.day.condition.text)} 
                size={40} 
                color="#2ecc71" 
              />
              <View style={styles.tempContainer}>
                <Text style={styles.maxTemp}>
                  {day.day.maxtemp_c.toFixed(0)}°
                </Text>
                <Text style={styles.minTemp}>
                  {day.day.mintemp_c.toFixed(0)}°
                </Text>
              </View>
              <Text style={styles.rainChance}>
                ☔ {day.day.daily_chance_of_rain}%
              </Text>
            </Animated.View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  currentWeatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  locationTitle: {
    fontSize: 24,
    color: '#2ecc71',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  temperatureText: {
    fontSize: 48,
    color: '#2ecc71',
    fontWeight: '300',
  },
  conditionText: {
    fontSize: 18,
    color: '#2ecc71',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  detailItem: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#2ecc71',
    fontWeight: '600',
    marginBottom: 20,
  },
  hourlyForecastContainer: {
    gap: 15,
    paddingBottom: 10,
  },
  hourlyForecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: 100,
  },
  hourlyForecastTime: {
    color: '#2ecc71',
    fontWeight: '500',
    marginBottom: 10,
  },
  hourlyForecastTemp: {
    color: '#2ecc71',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 5,
  },
  hourlyForecastRain: {
    color: '#2ecc71',
    fontSize: 14,
  },
  forecastContainer: {
    gap: 15,
    paddingBottom: 10,
  },
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: 120,
  },
  forecastDay: {
    color: '#2ecc71',
    fontWeight: '500',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  tempContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  maxTemp: {
    color: '#2ecc71',
    fontSize: 18,
    fontWeight: '600',
  },
  minTemp: {
    color: 'rgba(46, 204, 113, 0.7)',
    fontSize: 16,
  },
  rainChance: {
    color: '#2ecc71',
    fontSize: 14,
    marginTop: 5,
  },
});