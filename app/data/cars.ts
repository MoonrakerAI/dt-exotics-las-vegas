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
  }
  audio: {
    startup?: string
    rev?: string
  }
  available: boolean
}

export const cars: Car[] = [
  {
    id: 'lambo-huracan-spyder',
    brand: 'Lamborghini',
    model: 'Huracán Spyder',
    year: 2019,
    category: 'Supercar',
    stats: {
      horsepower: 610,
      torque: 413,
      topSpeed: 201,
      acceleration: 3.4,
      engine: '5.2L V10',
      drivetrain: 'AWD',
      doors: 2
    },
    features: [
      'Convertible Top',
      'All-Wheel Drive',
      'Carbon Ceramic Brakes',
      'Adaptive Suspension',
      'Launch Control'
    ],
    price: {
      daily: 1499,
      weekly: 8999
    },
    images: {
      main: '/cars/Lambo Huracan Spyder 2019 (Black)/pics/Lambo Huracan Spyder - Edited.png',
      gallery: [
        '/cars/Lambo Huracan Spyder 2019 (Black)/pics/album/1.jpg',
        '/cars/Lambo Huracan Spyder 2019 (Black)/pics/album/2.jpg',
        '/cars/Lambo Huracan Spyder 2019 (Black)/pics/album/3.jpg'
      ]
    },
    videos: {
      showcase: '/cars/Lambo Huracan Spyder 2019 (Black)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Lambo Huracan Spyder 2019 (Black)/audio/startup.mp3',
      rev: '/cars/Lambo Huracan Spyder 2019 (Black)/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'lambo-huracan-coupe',
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
    available: true
  },
  {
    id: 'corvette-c8',
    brand: 'Chevrolet',
    model: 'Corvette C8 Stingray',
    year: 2024,
    category: 'Sports Car',
    stats: {
      horsepower: 500,
      torque: 470,
      topSpeed: 194,
      acceleration: 2.9,
      engine: '6.2L V8',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Mid-Engine Design',
      'Magnetic Ride Control',
      'Performance Traction Management',
      'Launch Control',
      'Z51 Performance Package'
    ],
    price: {
      daily: 699,
      weekly: 3999
    },
    images: {
      main: '/cars/Chevy Corvette C8 2024 (Red)/pics/Untitled Design - 1 - Edited.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Chevy Corvette C8 2024 (Red)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Chevy Corvette C8 2024 (Red)/audio/startup.mp3',
      rev: '/cars/Chevy Corvette C8 2024 (Red)/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'audi-r8-black-panther',
    brand: 'Audi',
    model: 'R8 Black Panther Edition',
    year: 2021,
    category: 'Supercar',
    stats: {
      horsepower: 611,
      torque: 428,
      topSpeed: 205,
      acceleration: 3.1,
      engine: '5.2L V10',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Black Panther Custom Wrap',
      'Carbon Fiber Package',
      'Bang & Olufsen Sound',
      'Virtual Cockpit Plus',
      'Dynamic Steering'
    ],
    price: {
      daily: 1199,
      weekly: 6999
    },
    images: {
      main: '/cars/Audi R8 2021 (Black Panther)/pics/AUDI-R8 - Edited.png',
      gallery: [
        '/cars/Audi R8 2021 (Black Panther)/pics/album/1.jpg',
        '/cars/Audi R8 2021 (Black Panther)/pics/album/2.jpg',
        '/cars/Audi R8 2021 (Black Panther)/pics/album/3.jpg',
        '/cars/Audi R8 2021 (Black Panther)/pics/album/4.jpg'
      ]
    },
    videos: {
      showcase: '/cars/Audi R8 2021 (Black Panther)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Audi R8 2021 (Black Panther)/audio/startup.mp3',
      rev: '/cars/Audi R8 2021 (Black Panther)/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'mercedes-glc-amg',
    brand: 'Mercedes-Benz',
    model: 'GLC AMG',
    year: 2021,
    category: 'Performance SUV',
    stats: {
      horsepower: 429,
      torque: 384,
      topSpeed: 155,
      acceleration: 5.3,
      engine: '3.0L Turbo I6 + EQ Boost',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'AMG Performance 4MATIC+',
      'AIRMATIC Suspension',
      'AMG Track Pace',
      'Burmester Sound System',
      'AMG Night Package'
    ],
    price: {
      daily: 549,
      weekly: 3299
    },
    images: {
      main: '/cars/Mercedes GLC AMG 2021 (White)/pics/GLE - Edited.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Mercedes GLC AMG 2021 (White)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Mercedes GLC AMG 2021 (White)/audio/startup.mp3',
      rev: '/cars/Mercedes GLC AMG 2021 (White)/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'audi-s5',
    brand: 'Audi',
    model: 'S5 Sportback',
    year: 2024,
    category: 'Performance Sedan',
    stats: {
      horsepower: 362,
      torque: 369,
      topSpeed: 155,
      acceleration: 4.5,
      engine: '3.0L Turbo V6',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'Quattro Sport Differential',
      'S Sport Suspension',
      'Virtual Cockpit',
      'Diamond Stitched Seats',
      'Sport Exhaust System'
    ],
    price: {
      daily: 399,
      weekly: 2499
    },
    images: {
      main: '/cars/Audi S5 2024 (Gray)/pics/AudiS5 - Edited.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Audi S5 2024 (Gray)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Audi S5 2024 (Gray)/audio/startup.mp3',
      rev: '/cars/Audi S5 2024 (Gray)/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'audi-sq8',
    brand: 'Audi',
    model: 'SQ8',
    year: 2024,
    category: 'Performance SUV',
    stats: {
      horsepower: 349,
      torque: 369,
      topSpeed: 155,
      acceleration: 4.8,
      engine: '3.0L Turbo V6',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'Quattro All-Wheel Drive',
      'Air Suspension',
      'Virtual Cockpit',
      'Matrix LED Headlights',
      'Premium Plus Package'
    ],
    price: {
      daily: 499,
      weekly: 2999
    },
    images: {
      main: '/cars/Audi SQ8 2024 (Black)/pics/Audi SQ8 - Edited (1).png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Audi SQ8 2024 (Black)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Audi SQ8 2024 (Black)/audio/startup.mp3',
      rev: '/cars/Audi SQ8 2024 (Black)/audio/rev.mp3'
    },
    available: true
  }
]