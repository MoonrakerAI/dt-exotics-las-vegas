// Utility to get car image with fallback
export const getCarImage = (car: { brand: string; model: string; year: number; images: { main: string } }) => {
  // Check if the image exists (in a real app, you'd check the file system)
  // For now, we'll provide fallback images for known missing cars
  const fallbackImages: { [key: string]: string } = {
    'mercedes-g550': '/cars/fallback/mercedes-g550.jpg',
    'mercedes-glb250': '/cars/fallback/mercedes-glb250.jpg',
    'porsche-cayman-gts': '/cars/fallback/porsche-cayman-gts.jpg',
    'porsche-911-carrera': '/cars/fallback/porsche-911-carrera.jpg',
    'porsche-911-992': '/cars/fallback/porsche-911-992.jpg',
    'audi-sq8-etron': '/cars/fallback/audi-sq8-etron.jpg',
    'land-rover-range-rover': '/cars/fallback/land-rover-range-rover.jpg'
  };

  // First try the specified image
  if (car.images.main && car.images.main !== '') {
    return car.images.main;
  }

  // Look for fallback image
  const carKey = `${car.brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${car.model.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (fallbackImages[carKey]) {
    return fallbackImages[carKey];
  }

  // Generic fallback
  return '/cars/fallback/generic-car.jpg';
};

// Get brand-specific fallback image
export const getBrandFallback = (brand: string) => {
  const brandFallbacks: { [key: string]: string } = {
    'mercedes-benz': '/cars/fallback/mercedes-generic.jpg',
    'porsche': '/cars/fallback/porsche-generic.jpg',
    'audi': '/cars/fallback/audi-generic.jpg',
    'lamborghini': '/cars/fallback/lamborghini-generic.jpg',
    'land rover': '/cars/fallback/land-rover-generic.jpg',
    'chevrolet': '/cars/fallback/chevrolet-generic.jpg'
  };

  return brandFallbacks[brand.toLowerCase()] || '/cars/fallback/generic-car.jpg';
};