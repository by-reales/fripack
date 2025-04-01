export const getWeatherApiKey = () => {
  const parts = [
    atob('MWViNWFl'),       // part1 (1eb5ae)
    atob('NTg2NTNl'),       // part2 (58653e)
    String.fromCharCode(52, 57, 49, 99, 98, 101),  // part3 (491cbe)
    atob('YjE5Mjgz'),       // part4 (b19283)
    '2251203'               // part5 (como string)
  ];
  
  return parts.join('');

  
};