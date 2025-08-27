export interface Car {
  id: string
  brand: string
  model: string
  year: number
  category: string
  stats: {
    horsepower: number
    torque: number
    topSpeed: number
    acceleration: number // 0-60 mph in seconds
    engine: string
    drivetrain: string
    doors: number
  }
  features: string[]
  price: {
    daily: number
    weekly: number
  }
  images: {
    main: string
    gallery: string[]
  }
  videos: {
    showcase?: string
    youtube?: string
  }
  audio: {
    startup?: string
    rev?: string
  }
  available: boolean
  showOnHomepage?: boolean
  displayOrder?: number // For custom ordering in admin
}

export const cars: Car[] = [
  // LAMBORGHINI - 2015 Huracán Coupé
  {
    id: 'lamborghini-h-2015',
    brand: 'Lamborghini',
    model: 'Huracán Coupé',
    year: 2015,
    category: 'Supercar',
    stats: {
      horsepower: 610,
      torque: 413,
      topSpeed: 202,
      acceleration: 3.2,
      engine: '5.2L V10',
      drivetrain: 'AWD',
      doors: 2
    },
    features: [
      'All-Wheel Drive',
      'Carbon Ceramic Brakes',
      'Adaptive Suspension',
      'Launch Control',
      'Track Mode'
    ],
    price: {
      daily: 1399,
      weekly: 8499
    },
    images: {
      main: '/cars/Lambo Huracan Coupe 2015 (Green)/pics/LAMBOcoupe - Edited.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Lambo Huracan Coupe 2015 (Green)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Lambo Huracan Coupe 2015 (Green)/audio/startup.mp3',
      rev: '/cars/Lambo Huracan Coupe 2015 (Green)/audio/rev.mp3'
    },
    available: true,
    showOnHomepage: true
  },

  // CHEVROLET - 2024 Corvette C8 Stingray
  {
    id: 'corvette-c8',
    brand: 'Chevrolet',
    model: 'Corvette C8 Stingray',
    year: 2024,
    category: 'Sports Car',
    stats: {
      horsepower: 495,
      torque: 470,
      topSpeed: 194,
      acceleration: 2.9,
      engine: '6.2L V8',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Mid-Engine Layout',
      'Magnetic Ride Control',
      'Performance Traction Management',
      'Launch Control',
      'Z51 Performance Package'
    ],
    price: {
      daily: 599,
      weekly: 3599
    },
    images: {
      main: '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - Main.png',
      gallery: [
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 1.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 2.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 3.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 4.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 5.jpg'
      ]
    },
    videos: {
      showcase: '/cars/Chevy Corvette C8 2024 (Red)/vids/showcase.mp4',
      youtube: 'https://www.youtube.com/watch?v=2z5A-COlDPk'
    },
    audio: {
      startup: '/cars/Chevy Corvette C8 2024 (Red)/audio/C8 - Cold Start.wav',
      rev: '/cars/Chevy Corvette C8 2024 (Red)/audio/C8 - Rev.wav'
    },
    available: true,
    showOnHomepage: true
  }
]
