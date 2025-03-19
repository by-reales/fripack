import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

interface OnboardingProps {
  onFinish: () => void;
}

const onboardingSteps = [
  {
    title: 'Te damos la Bienvenida',
    description: 'Nos enfocamos en mejorar la movilidad estudiantil en la Universidad Simón Bolívar ofreciendo rutas sostenibles.',
    animation: require('../animations/Animation - 1742337414420.json'),
  },
  {
    title: 'Mapa entre sedes',
    description: 'Explora las rutas más frescas entre las sedes de la Universidad Simón Bolívar.',
    animation: require('../animations/Animation - 1742393189170.json'),
  },
  {
    title: 'Listo para empezar',
    description: 'Comienza a usar la aplicación ahora.',
    animation: require('../animations/Animation - 1742393091113.json'),
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Oculta la barra de navegación inferior cuando el componente se monta
    NavigationBar.setVisibilityAsync('hidden');
    
    // Restaura la visibilidad de la barra de navegación cuando el componente se desmonta
    return () => {
      NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish(); // Llama a onFinish cuando el onboarding termina
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1); // Retrocede al paso anterior
    }
  };

  const handleSkip = () => {
    onFinish(); // Llama a onFinish cuando el usuario salta el onboarding
  };

  return (
    <>
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Botón "Saltar" en la esquina superior izquierda */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Saltar</Text>
        </TouchableOpacity>

        {/* Contenedor de la animación (usando Lottie) */}
        <View style={styles.animationContainer}>
          <LottieView
            source={onboardingSteps[currentStep].animation} // Carga la animación correspondiente al paso actual
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        {/* Título y descripción */}
        <Text style={styles.title}>{onboardingSteps[currentStep].title}</Text>
        <Text style={styles.description}>{onboardingSteps[currentStep].description}</Text>

        {/* Botones en la parte inferior */}
        <View style={styles.buttonContainer}>
          {/* Botón "Anterior" (solo visible si no es el primer paso) */}
          {currentStep > 0 && (
            <TouchableOpacity onPress={handlePrevious} style={styles.previousButton}>
              <Text style={styles.buttonText}>Anterior</Text>
            </TouchableOpacity>
          )}

          {/* Botón "Siguiente" o "Empezar" */}
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.buttonText}>
              {currentStep === onboardingSteps.length - 1 ? 'Empezar' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2ecc71', // Fondo verde
  },
  animationContainer: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%', // Ajusta el tamaño de la animación
    height: '100%',
    marginBottom: 50,
    
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff', // Texto blanco
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff', // Texto blanco
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centrar los botones
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  skipButtonText: {
    color: '#fff', // Texto blanco
    fontSize: 16,
    textDecorationLine: 'underline', // Subrayado para el botón de saltar
  },
  previousButton: {
    padding: 15,
    backgroundColor: '#34495e', // Color del botón "Anterior"
    borderRadius: 25, // Bordes redondeados
    width: '45%', // Mismo ancho que el botón "Siguiente"
    alignItems: 'center', // Centrar texto
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginRight: 10, // Espacio entre el botón "Anterior" y "Siguiente"
  },
  nextButton: {
    padding: 15,
    backgroundColor: '#34495e', // Color del botón "Siguiente"
    borderRadius: 25, // Bordes redondeados
    width: '45%', // Mismo ancho que el botón "Anterior"
    alignItems: 'center', // Centrar texto
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff', // Texto blanco
    fontSize: 16,
    fontWeight: 'bold', // Texto en negrita
  },
});

export default Onboarding;