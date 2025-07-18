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
  // LAMBORGHINI - Ultra-Premium Supercars
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

  // PORSCHE - Premium Sports Cars
  {
    id: 'porsche-911-992',
    brand: 'Porsche',
    model: '911 992',
    year: 2022,
    category: 'Sports Car',
    stats: {
      horsepower: 379,
      torque: 331,
      topSpeed: 182,
      acceleration: 4.0,
      engine: '3.0L Twin-Turbo Flat-6',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Next-Generation 911',
      'Wet Mode',
      'Sport Chrono Package',
      'PASM Sport Suspension',
      'Porsche Communication Management 6.0'
    ],
    price: {
      daily: 699,
      weekly: 4199
    },
    images: {
      main: '/cars/Porsche 911 992 2022/pics/Porsche 911 992 - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Porsche 911 992 2022/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Porsche 911 992 2022/audio/startup.mp3',
      rev: '/cars/Porsche 911 992 2022/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'porsche-911-carrera',
    brand: 'Porsche',
    model: '911 Carrera',
    year: 2013,
    category: 'Sports Car',
    stats: {
      horsepower: 350,
      torque: 287,
      topSpeed: 179,
      acceleration: 4.6,
      engine: '3.4L Flat-6',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Classic 911 Design',
      'Sport Chrono Package',
      'PASM Suspension',
      'Porsche Communication Management',
      'Sport Seats Plus'
    ],
    price: {
      daily: 579,
      weekly: 3499
    },
    images: {
      main: '/cars/Porsche 911 Carrera 2013/pics/Porsche 911 Carrera - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Porsche 911 Carrera 2013/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Porsche 911 Carrera 2013/audio/startup.mp3',
      rev: '/cars/Porsche 911 Carrera 2013/audio/rev.mp3'
    },
    available: true
  },
  {
    id: 'porsche-cayman-gts',
    brand: 'Porsche',
    model: 'Cayman GTS',
    year: 2016,
    category: 'Sports Car',
    stats: {
      horsepower: 340,
      torque: 280,
      topSpeed: 177,
      acceleration: 4.6,
      engine: '3.4L Flat-6',
      drivetrain: 'RWD',
      doors: 2
    },
    features: [
      'Sport Chrono Package',
      'PASM Adaptive Suspension',
      'Sport Design Package',
      'Alcantara Interior',
      'Sport Exhaust System'
    ],
    price: {
      daily: 499,
      weekly: 2999
    },
    images: {
      main: '/cars/Porsche Cayman GTS 2016/pics/Porsche Cayman GTS - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Porsche Cayman GTS 2016/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Porsche Cayman GTS 2016/audio/startup.mp3',
      rev: '/cars/Porsche Cayman GTS 2016/audio/rev.mp3'
    },
    available: true
  },

  // AUDI - Performance Luxury
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
    id: 'audi-sq8-etron',
    brand: 'Audi',
    model: 'SQ8 e-tron',
    year: 2024,
    category: 'Electric Performance SUV',
    stats: {
      horsepower: 496,
      torque: 718,
      topSpeed: 130,
      acceleration: 4.5,
      engine: 'Tri-Motor Electric',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'Electric Performance',
      'Quattro All-Wheel Drive',
      'Air Suspension',
      'Virtual Cockpit Plus',
      'Matrix LED Headlights'
    ],
    price: {
      daily: 549,
      weekly: 3299
    },
    images: {
      main: '/cars/Audi SQ8 e-tron 2024/pics/Audi SQ8 e-tron - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Audi SQ8 e-tron 2024/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Audi SQ8 e-tron 2024/audio/startup.mp3',
      rev: '/cars/Audi SQ8 e-tron 2024/audio/rev.mp3'
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

  // MERCEDES-BENZ - Luxury Performance
  {
    id: 'mercedes-g550',
    brand: 'Mercedes-Benz',
    model: 'G550',
    year: 2021,
    category: 'Luxury SUV',
    stats: {
      horsepower: 416,
      torque: 450,
      topSpeed: 130,
      acceleration: 5.6,
      engine: '4.0L Twin-Turbo V8',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'G-Class Luxury Interior',
      'AMG Line Package',
      'Burmester Surround Sound',
      'Active Multicontour Seats',
      'Off-Road Engineering'
    ],
    price: {
      daily: 649,
      weekly: 3899
    },
    images: {
      main: '/cars/Mercedes G550 2021/pics/Mercedes G550 - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Mercedes G550 2021/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Mercedes G550 2021/audio/startup.mp3',
      rev: '/cars/Mercedes G550 2021/audio/rev.mp3'
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
    id: 'mercedes-glb250-amg',
    brand: 'Mercedes-Benz',
    model: 'GLB250 AMG Package',
    year: 2023,
    category: 'Compact Performance SUV',
    stats: {
      horsepower: 221,
      torque: 258,
      topSpeed: 130,
      acceleration: 7.1,
      engine: '2.0L Turbo I4',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'AMG Line Package',
      'MBUX Infotainment',
      'LED High Performance Headlights',
      'AMG Bodystyling',
      'Sport Suspension'
    ],
    price: {
      daily: 249,
      weekly: 1499
    },
    images: {
      main: '/cars/Mercedes GLB250 AMG 2023/pics/Mercedes GLB250 AMG - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Mercedes GLB250 AMG 2023/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Mercedes GLB250 AMG 2023/audio/startup.mp3',
      rev: '/cars/Mercedes GLB250 AMG 2023/audio/rev.mp3'
    },
    available: true
  },

  // CHEVROLET - American Performance
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
      main: '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - Main.png',
      gallery: [
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 1.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 2.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 3.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 4.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 5.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 6.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 7.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 8.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 9.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 10.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 11.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 12.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 13.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 14.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 15.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 16.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 17.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 18.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 19.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 20.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 21.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 22.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 23.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 24.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 25.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 26.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 27.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 28.jpg',
        '/cars/Chevy Corvette C8 2024 (Red)/pics/Chevy Corvette C8 2024 (Red) - 29.jpg'
      ]
    },
    videos: {
      showcase: '/cars/Chevy Corvette C8 2024 (Red)/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Chevy Corvette C8 2024 (Red)/audio/C8 - Cold Start.wav',
      rev: '/cars/Chevy Corvette C8 2024 (Red)/audio/C8 - Rev.wav'
    },
    available: true
  },

  // LAND ROVER - Luxury SUV
  {
    id: 'land-rover-range-rover',
    brand: 'Land Rover',
    model: 'Range Rover',
    year: 2019,
    category: 'Luxury SUV',
    stats: {
      horsepower: 518,
      torque: 461,
      topSpeed: 140,
      acceleration: 5.4,
      engine: '5.0L Supercharged V8',
      drivetrain: 'AWD',
      doors: 4
    },
    features: [
      'Terrain Response System',
      'Air Suspension',
      'Windsor Leather Interior',
      'Meridian Sound System',
      'Configurable Ambient Lighting'
    ],
    price: {
      daily: 449,
      weekly: 2699
    },
    images: {
      main: '/cars/Land Rover Range Rover 2019/pics/Land Rover Range Rover - Main.png',
      gallery: []
    },
    videos: {
      showcase: '/cars/Land Rover Range Rover 2019/vids/showcase.mp4'
    },
    audio: {
      startup: '/cars/Land Rover Range Rover 2019/audio/startup.mp3',
      rev: '/cars/Land Rover Range Rover 2019/audio/rev.mp3'
    },
    available: true
  },

]