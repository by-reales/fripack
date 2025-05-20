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
    
    NavigationBar.setVisibilityAsync('hidden');
    
    
    return () => {
      NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish(); 
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1); 
    }
  };

  const handleSkip = () => {
    onFinish(); 
  };

  return (
    <>
      <StatusBar hidden />
      <View style={styles.container}>
        {}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Saltar</Text>
        </TouchableOpacity>

        {}
        <View style={styles.animationContainer}>
          <LottieView
            source={onboardingSteps[currentStep].animation} 
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        {}
        <Text style={styles.title}>{onboardingSteps[currentStep].title}</Text>
        <Text style={styles.description}>{onboardingSteps[currentStep].description}</Text>

        {}
        <View style={styles.buttonContainer}>
          {}
          {currentStep > 0 && (
            <TouchableOpacity onPress={handlePrevious} style={styles.previousButton}>
              <Text style={styles.buttonText}>Anterior</Text>
            </TouchableOpacity>
          )}

          {}
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
    backgroundColor: '#2ecc71', 
  },
  animationContainer: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%', 
    height: '100%',
    marginBottom: 50,
    
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff', 
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
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
    color: '#fff', 
    fontSize: 16,
    textDecorationLine: 'underline', 
  },
  previousButton: {
    padding: 15,
    backgroundColor: '#34495e', 
    borderRadius: 25, 
    width: '45%', 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginRight: 10, 
  },
  nextButton: {
    padding: 15,
    backgroundColor: '#34495e', 
    borderRadius: 25, 
    width: '45%', 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: 'bold', 
  },
});

export default Onboarding;