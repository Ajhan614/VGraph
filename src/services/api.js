const calculateLayoutFromFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/calculate_coordinates', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data; // Теперь возвращаем объект с nodes и edges
  } catch (error) {
    console.error('Error calculating layout:', error);
    throw error;
  }
};

export default calculateLayoutFromFile;