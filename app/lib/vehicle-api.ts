// Vehicle API service for auto-populating car data
export interface VehicleSpecs {
  make: string;
  model: string;
  year: number;
  category?: string;
  engine?: string;
  horsepower?: number;
  topSpeed?: number;
  acceleration?: string;
  doors?: number;
  fuel?: string;
  transmission?: string;
  drivetrain?: string;
  features?: string[];
  stockImages?: {
    main?: string;
    gallery?: string[];
  };
  msrp?: number;
}

export interface VehicleLookupResponse {
  success: boolean;
  data?: VehicleSpecs;
  error?: string;
}

class VehicleAPIService {
  // API-Ninjas Cars API for comprehensive modern car data (free tier available)
  private readonly API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1/cars';
  private readonly API_NINJAS_KEY = process.env.API_NINJAS_KEY; // Get free key from api.api-ninjas.com

  // NHTSA API for basic vehicle data (free) - fallback
  private readonly NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  // Auto.dev API for detailed specs and images (requires API key)
  private readonly AUTO_DEV_BASE_URL = 'https://auto.dev/api';
  private readonly AUTO_DEV_API_KEY = process.env.AUTO_DEV_API_KEY; // Optional for enhanced data

  async lookupVehicle(year: number, make: string, model: string): Promise<VehicleLookupResponse> {
    try {
      console.log(`Looking up vehicle: ${year} ${make} ${model}`);

      // Try API-Ninjas first (best for modern cars and supercars)
      if (this.API_NINJAS_KEY) {
        const ninjasData = await this.getAPINinjasVehicleData(year, make, model);
        if (ninjasData.success) {
          return ninjasData;
        }
      }

      // Try enhanced API if available
      if (this.AUTO_DEV_API_KEY) {
        const enhancedData = await this.getEnhancedVehicleData(year, make, model);
        if (enhancedData.success) {
          return enhancedData;
        }
      }

      // Fallback to NHTSA API
      const basicData = await this.getNHTSAVehicleData(year, make, model);
      return basicData;

    } catch (error) {
      console.error('Vehicle lookup error:', error);
      return {
        success: false,
        error: 'Failed to lookup vehicle data. Please enter details manually.'
      };
    }
  }

  private async getAPINinjasVehicleData(year: number, make: string, model: string): Promise<VehicleLookupResponse> {
    try {
      const params = new URLSearchParams({
        make: make.trim(),
        model: model.trim(),
        year: year.toString()
      });

      const response = await fetch(`${this.API_NINJAS_BASE_URL}?${params}`, {
        headers: {
          'X-Api-Key': this.API_NINJAS_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`API-Ninjas API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Vehicle not found in API-Ninjas database'
        };
      }

      // Take the first result (most relevant)
      const vehicleData = data[0];
      
      const vehicleSpecs: VehicleSpecs = {
        make: this.capitalizeWords(vehicleData.make || make),
        model: this.capitalizeWords(vehicleData.model || model),
        year: vehicleData.year || year,
        category: this.inferCategory(vehicleData.make || make, vehicleData.model || model),
        engine: vehicleData.engine_type || undefined,
        horsepower: vehicleData.horsepower || undefined,
        fuel: vehicleData.fuel_type || undefined,
        transmission: vehicleData.transmission || undefined,
        drivetrain: vehicleData.drive || undefined,
        doors: vehicleData.doors || undefined,
        features: this.getDefaultFeatures(),
        stockImages: this.getStockImagePlaceholders(vehicleData.make || make, vehicleData.model || model)
      };

      // Handle top speed from API Ninja (convert km/h to MPH if needed)
      if (vehicleData.top_speed) {
        // API Ninja typically returns top speed in km/h, convert to MPH
        vehicleSpecs.topSpeed = this.convertKmhToMph(vehicleData.top_speed);
      }

      // Add performance estimates if not provided by API
      const performanceData = this.getPerformanceEstimates(vehicleData.make || make, vehicleData.model || model);
      if (performanceData) {
        // Only use our database values if API didn't provide them
        if (!vehicleSpecs.topSpeed) {
          vehicleSpecs.topSpeed = performanceData.topSpeed;
        }
        if (!vehicleData.acceleration) {
          vehicleSpecs.acceleration = performanceData.acceleration;
        }
      }

      return {
        success: true,
        data: vehicleSpecs
      };

    } catch (error) {
      console.error('API-Ninjas API error:', error);
      return { 
        success: false, 
        error: 'API-Ninjas lookup failed' 
      };
    }
  }

  private async getEnhancedVehicleData(year: number, make: string, model: string): Promise<VehicleLookupResponse> {
    try {
      // This would use Auto.dev API for enhanced data including stock photos
      // For now, we'll implement a mock response since we don't have the API key
      return {
        success: false,
        error: 'Enhanced API not configured'
      };
    } catch (error) {
      return { success: false, error: 'Enhanced API failed' };
    }
  }

  private async getNHTSAVehicleData(year: number, make: string, model: string): Promise<VehicleLookupResponse> {
    try {
      // First, get the make ID
      const makeResponse = await fetch(`${this.NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(make)}?format=json`);
      
      if (!makeResponse.ok) {
        throw new Error('Failed to fetch make data');
      }

      const makeData = await makeResponse.json();
      
      if (!makeData.Results || makeData.Results.length === 0) {
        return {
          success: false,
          error: `Make "${make}" not found. Please check spelling.`
        };
      }

      // Find the specific model
      const modelMatch = makeData.Results.find((m: any) => 
        m.Model_Name.toLowerCase().includes(model.toLowerCase())
      );

      if (!modelMatch) {
        // Still provide basic data even if exact model not found
        const vehicleSpecs: VehicleSpecs = {
          make: this.capitalizeWords(make),
          model: this.capitalizeWords(model),
          year: year,
          category: this.inferCategory(make, model),
          features: this.getDefaultFeatures(),
          stockImages: this.getStockImagePlaceholders(make, model)
        };

        return {
          success: true,
          data: vehicleSpecs
        };
      }

      // Get additional vehicle details if available
      const vehicleSpecs = await this.enrichVehicleData(year, make, model, modelMatch);
      
      return {
        success: true,
        data: vehicleSpecs
      };

    } catch (error) {
      console.error('NHTSA API error:', error);
      
      // Return basic data as fallback
      const fallbackSpecs: VehicleSpecs = {
        make: this.capitalizeWords(make),
        model: this.capitalizeWords(model),
        year: year,
        category: this.inferCategory(make, model),
        features: this.getDefaultFeatures(),
        stockImages: this.getStockImagePlaceholders(make, model)
      };

      return {
        success: true,
        data: fallbackSpecs
      };
    }
  }

  private async enrichVehicleData(year: number, make: string, model: string, modelMatch: any): Promise<VehicleSpecs> {
    // Enrich with inferred data based on make/model
    const specs: VehicleSpecs = {
      make: this.capitalizeWords(make),
      model: this.capitalizeWords(model),
      year: year,
      category: this.inferCategory(make, model),
      features: this.getDefaultFeatures(),
      stockImages: this.getStockImagePlaceholders(make, model)
    };

    // Add performance estimates for exotic/luxury cars
    const performanceData = this.getPerformanceEstimates(make, model);
    if (performanceData) {
      specs.engine = performanceData.engine;
      specs.horsepower = performanceData.horsepower;
      specs.topSpeed = performanceData.topSpeed;
      specs.acceleration = performanceData.acceleration;
      specs.doors = performanceData.doors;
      specs.fuel = performanceData.fuel;
      specs.transmission = performanceData.transmission;
      specs.drivetrain = performanceData.drivetrain;
    }

    return specs;
  }

  private capitalizeWords(str: string): string {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // Convert km/h to MPH (API Ninja may return speeds in km/h)
  private convertKmhToMph(kmh: number): number {
    return Math.round(kmh * 0.621371);
  }

  private inferCategory(make: string, model: string): string {
    const makeLower = make.toLowerCase();
    const modelLower = model.toLowerCase();

    // Exotic/Supercar brands
    if (['lamborghini', 'ferrari', 'mclaren', 'bugatti', 'koenigsegg', 'pagani'].includes(makeLower)) {
      return 'Supercar';
    }

    // Luxury/Sports brands
    if (['porsche', 'aston martin', 'bentley', 'rolls-royce', 'maserati'].includes(makeLower)) {
      return 'Luxury';
    }

    // Sports cars by model
    if (modelLower.includes('corvette') || modelLower.includes('mustang') || 
        modelLower.includes('camaro') || modelLower.includes('challenger')) {
      return 'Sports Car';
    }

    // SUVs
    if (modelLower.includes('suv') || modelLower.includes('urus') || 
        modelLower.includes('cayenne') || modelLower.includes('macan')) {
      return 'Luxury SUV';
    }

    return 'Luxury'; // Default for rental fleet
  }

  private getPerformanceEstimates(make: string, model: string) {
    const makeLower = make.toLowerCase();
    const modelLower = model.toLowerCase();

    // Database of common exotic/luxury car specs (topSpeed in MPH)
    const performanceDB: { [key: string]: any } = {
      'lamborghini_huracan': {
        engine: '5.2L V10',
        horsepower: 630,
        topSpeed: 202, // Converted from 325 km/h to MPH
        acceleration: '3.2',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'lamborghini_urus': {
        engine: '4.0L V8 Twin-Turbo',
        horsepower: 641,
        topSpeed: 190, // Converted from 305 km/h to MPH
        acceleration: '3.6',
        doors: 4,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'ferrari_488': {
        engine: '3.9L V8 Twin-Turbo',
        horsepower: 661,
        topSpeed: 205, // Converted from 330 km/h to MPH
        acceleration: '3.0',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'RWD'
      },
      'porsche_911': {
        engine: '3.0L H6 Twin-Turbo',
        horsepower: 443,
        topSpeed: 182, // Converted from 293 km/h to MPH
        acceleration: '3.5',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'audi_r8': {
        engine: '5.2L V10',
        horsepower: 562,
        topSpeed: 201, // Converted from 324 km/h to MPH
        acceleration: '3.2',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'chevrolet_corvette': {
        engine: '6.2L V8',
        horsepower: 495,
        topSpeed: 194, // Converted from 312 km/h to MPH
        acceleration: '2.9',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'RWD'
      }
    };

    // Try to match the vehicle
    const key = `${makeLower}_${modelLower.split(' ')[0]}`;
    return performanceDB[key] || null;
  }

  private getDefaultFeatures(): string[] {
    return [
      'Premium Sound System',
      'Climate Control',
      'Leather Seats',
      'Navigation System',
      'Bluetooth Connectivity',
      'Premium Wheels',
      'Sport Suspension',
      'Carbon Fiber Accents'
    ];
  }

  private getStockImagePlaceholders(make: string, model: string): { main?: string; gallery?: string[] } {
    // For now, return placeholder URLs - in production, you'd integrate with image APIs
    const makeModel = `${make} ${model}`.replace(/\s+/g, '-').toLowerCase();
    
    return {
      main: `https://images.unsplash.com/search/photos/${encodeURIComponent(make + ' ' + model)}?w=800&h=600&fit=crop`,
      gallery: [
        `https://images.unsplash.com/search/photos/${encodeURIComponent(make + ' ' + model + ' interior')}?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/search/photos/${encodeURIComponent(make + ' ' + model + ' side')}?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/search/photos/${encodeURIComponent(make + ' ' + model + ' rear')}?w=800&h=600&fit=crop`
      ]
    };
  }

  // Get vehicle suggestions for autocomplete
  async getVehicleSuggestions(make: string, model?: string): Promise<{
    makes: string[];
    models: string[];
  }> {
    try {
      const suggestions = { makes: [], models: [] };

      // Get make suggestions
      if (make.length >= 2) {
        const makeResponse = await fetch(`${this.NHTSA_BASE_URL}/GetAllMakes?format=json`);
        const makeData = await makeResponse.json();
        
        const makes = makeData.Results.map((m: any) => m.Make_Name);
        const makeLower = make.toLowerCase();
        
        suggestions.makes = makes.filter((m: string) => 
          m.toLowerCase().includes(makeLower)
        ).slice(0, 8);
      }

      // Get model suggestions if make is provided
      if (make.length >= 2 && model && model.length >= 2) {
        try {
          const modelResponse = await fetch(`${this.NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(make)}?format=json`);
          const modelData = await modelResponse.json();
          
          if (modelData.Results) {
            const modelLower = model.toLowerCase();
            suggestions.models = modelData.Results
              .map((m: any) => m.Model_Name)
              .filter((m: string) => m.toLowerCase().includes(modelLower))
              .slice(0, 8);
          }
        } catch (error) {
          // Model fetch failed, continue with make suggestions only
        }
      }

      return suggestions;
    } catch (error) {
      return { makes: [], models: [] };
    }
  }

  // Validate make/model input
  async validateMakeModel(make: string): Promise<{ valid: boolean; suggestions?: string[] }> {
    try {
      const response = await fetch(`${this.NHTSA_BASE_URL}/GetAllMakes?format=json`);
      const data = await response.json();
      
      const makes = data.Results.map((m: any) => m.Make_Name);
      const makeLower = make.toLowerCase();
      
      // Exact match
      if (makes.some((m: string) => m.toLowerCase() === makeLower)) {
        return { valid: true };
      }

      // Find similar makes
      const suggestions = makes.filter((m: string) => 
        m.toLowerCase().includes(makeLower) || 
        makeLower.includes(m.toLowerCase())
      ).slice(0, 5);

      return {
        valid: false,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };
    } catch (error) {
      return { valid: true }; // Allow any input if API fails
    }
  }
}

export const vehicleAPI = new VehicleAPIService(); 