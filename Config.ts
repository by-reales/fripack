export const getWeatherApiKey = () => {
  return process.env.EXPO_PUBLIC_UV_API_KEY;
};

type Config = {
  DEFAULT_CITY: any;
  API_KEY: string;
  WEATHER_BASE_URL: string;
  WEATHERAPI_KEY: string;
  WEATHERAPI_BASE_URL: string;
};

const config: Config = {
  API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '',
  WEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
  WEATHERAPI_KEY: process.env.EXPO_PUBLIC_UV_API_KEY || '',
  WEATHERAPI_BASE_URL: 'https://api.weatherapi.com/v1',
  DEFAULT_CITY: 'Barranquilla'
};



export default config;