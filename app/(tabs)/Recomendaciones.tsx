import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import axios from 'axios';

const API_KEY = '1eb5ae58653e491cbeb192832251203';

interface WeatherData {
  current: {
    temp_c: number;
    uv: number;
    wind_kph: number;
    humidity: number;
    condition: {
      text: string;
    };
  };
}

const Recomendaciones = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Barranquilla&aqi=no`
        );
        setWeather(response.data);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!weather) return null;

  const { temp_c, uv, wind_kph, humidity, condition } = weather.current;
  const isRaining = condition.text.toLowerCase().includes('rain');

  // Clasificación de temperatura para Barranquilla
  const getTemperatureLevel = () => {
    if (temp_c < 25) return 'Baja';
    if (temp_c <= 32) return 'Media'; 
    return 'Alta';
  };

  // Clasificación del viento
  const getWindCondition = () => {
    if (wind_kph < 15) return 'Calmado';
    if (wind_kph <= 30) return 'Moderado';
    return 'Fuerte';
  };

  // Beneficios y riesgos UV
  const getUVEffects = () => {
    return {
      benefits: [
        'Síntesis de vitamina D (15-30 min al día)',
        'Mejora el estado de ánimo',
        'Regula el ciclo de sueño'
      ],
      risks: [
        'Quemaduras solares',
        'Envejecimiento prematuro',
        'Riesgo de cáncer de piel',
        'Daño ocular'
      ]
    };
  };

  // Recomendaciones de alimentación
  const getFoodRecommendations = () => {
    return [
      'Bebidas: agua de coco, limonada natural, jugo de tamarindo',
      'Agua de panela con limón para reponer electrolitos',
      'Frutas: sandía, melón, piña (hidratantes)',
      'Comidas ligeras: ensaladas, ceviches, sopas frías',
      'Evita comidas pesadas y grasosas en horas de calor'
    ];
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Clima Actual */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.card}>
          <Text style={styles.headerTitle}>Barranquilla</Text>
          <View style={styles.currentWeather}>
            <Ionicons
              name={isRaining ? 'rainy' : 'sunny'} 
              size={50} 
              color="#2ecc71" 
            />
            <View>
              <Text style={styles.temperature}>{temp_c}°C ({getTemperatureLevel()})</Text>
              <Text style={styles.detail}>Viento: {wind_kph} km/h ({getWindCondition()})</Text>
              <Text style={styles.detail}>UV: {uv} | Humedad: {humidity}%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Temperatura */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="thermometer" size={20} color="#2ecc71" /> Temperatura {getTemperatureLevel()}
          </Text>
          {getTemperatureLevel() === 'Baja' && (
            <Text style={styles.listItem}>• Aunque es raro en Barranquilla, lleva una chaqueta ligera para las aulas con aire acondicionado</Text>
          )}
          {getTemperatureLevel() === 'Media' && (
            <Text style={styles.listItem}>• Temperatura ideal para moverse por el campus</Text>
          )}
          {getTemperatureLevel() === 'Alta' && (
            <>
              <Text style={styles.listItem}>• Evita caminar bajo el sol entre 10am y 3pm</Text>
              <Text style={styles.listItem}>• Busca sombra en los pasillos cubiertos de la USB</Text>
              <Text style={styles.listItem}>• Hidrátate cada 30 minutos</Text>
            </>
          )}
        </Animated.View>

        {/* Protección Solar */}
        <Animated.View entering={FadeInRight.delay(300)} style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="sunny" size={20} color="#2ecc71" /> Protección UV
          </Text>
          <Text style={styles.subTitle}>Recomendaciones:</Text>
          <Text style={styles.listItem}>• Usa protector solar FPS 30+ (50+ si UV {'>'} 6)</Text>
          <Text style={styles.listItem}>• Reaplica cada 2 horas</Text>
          <Text style={styles.listItem}>• Usa gorra/visera y gafas de sol</Text>
          
          <Text style={styles.subTitle}>Beneficios UV:</Text>
          {getUVEffects().benefits.map((item, i) => (
            <Text key={`b-${i}`} style={styles.listItem}>• {item}</Text>
          ))}
          
          <Text style={styles.subTitle}>Riesgos UV:</Text>
          {getUVEffects().risks.map((item, i) => (
            <Text key={`r-${i}`} style={styles.listItem}>• {item}</Text>
          ))}
        </Animated.View>

        {/* Viento */}
        <Animated.View entering={FadeInRight.delay(400)} style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flag" size={20} color="#2ecc71" /> Viento {getWindCondition()}
          </Text>
          {getWindCondition() === 'Calmado' && (
            <Text style={styles.listItem}>• Condiciones normales para moverse por el campus</Text>
          )}
          {getWindCondition() === 'Moderado' && (
            <Text style={styles.listItem}>• Ten cuidado con papeles y apuntes al aire libre</Text>
          )}
          {getWindCondition() === 'Fuerte' && (
            <Text style={styles.listItem}>• Evita áreas con objetos que puedan volar</Text>
          )}
          <Text style={styles.listItem}>• Cuidado al cruzar las calles</Text>
        </Animated.View>

        {/* Alimentación */}
        <Animated.View entering={FadeInRight.delay(500)} style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="nutrition" size={20} color="#2ecc71" /> Alimentación
          </Text>
          {getFoodRecommendations().map((item, i) => (
            <Text key={`f-${i}`} style={styles.listItem}>• {item}</Text>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingTop: 35,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    color: '#2ecc71',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  temperature: {
    fontSize: 28,
    color: '#2ecc71',
    fontWeight: '600',
  },
  condition: {
    fontSize: 16,
    color: '#555',
    textTransform: 'capitalize',
  },
  detail: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2ecc71',
    fontWeight: '600',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subTitle: {
    color: '#2ecc71',
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  listItem: {
    color: '#555',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 5,
    marginLeft: 5,
  },
});

export default Recomendaciones;