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
  // NHTSA API for basic vehicle data (free)
  private readonly NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  // Auto.dev API for detailed specs and images (requires API key)
  private readonly AUTO_DEV_BASE_URL = 'https://auto.dev/api';
  private readonly AUTO_DEV_API_KEY = process.env.AUTO_DEV_API_KEY; // Optional for enhanced data

  async lookupVehicle(year: number, make: string, model: string): Promise<VehicleLookupResponse> {
    try {
      console.log(`Looking up vehicle: ${year} ${make} ${model}`);

      // Try enhanced API first if available, then fallback to NHTSA
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
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  private inferCategory(make: string, model: string): string {
    const makeLower = make.toLowerCase();
    const modelLower = model.toLowerCase();

    // Exotic/Supercar brands
    if (['lamborghini', 'ferrari', 'mclaren', 'bugatti', 'koenigsegg', 'pagani'].includes(makeLower)) {
      return 'exotic';
    }

    // Luxury/Sports brands
    if (['porsche', 'aston martin', 'bentley', 'rolls-royce', 'maserati'].includes(makeLower)) {
      return 'luxury';
    }

    // Sports cars by model
    if (modelLower.includes('corvette') || modelLower.includes('mustang') || 
        modelLower.includes('camaro') || modelLower.includes('challenger')) {
      return 'sports';
    }

    // SUVs
    if (modelLower.includes('suv') || modelLower.includes('urus') || 
        modelLower.includes('cayenne') || modelLower.includes('macan')) {
      return 'suv';
    }

    return 'luxury'; // Default for rental fleet
  }

  private getPerformanceEstimates(make: string, model: string) {
    const makeLower = make.toLowerCase();
    const modelLower = model.toLowerCase();

    // Database of common exotic/luxury car specs
    const performanceDB: { [key: string]: any } = {
      'lamborghini_huracan': {
        engine: '5.2L V10',
        horsepower: 630,
        topSpeed: 325,
        acceleration: '3.2',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'lamborghini_urus': {
        engine: '4.0L V8 Twin-Turbo',
        horsepower: 641,
        topSpeed: 305,
        acceleration: '3.6',
        doors: 4,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'ferrari_488': {
        engine: '3.9L V8 Twin-Turbo',
        horsepower: 661,
        topSpeed: 330,
        acceleration: '3.0',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'RWD'
      },
      'porsche_911': {
        engine: '3.0L H6 Twin-Turbo',
        horsepower: 443,
        topSpeed: 293,
        acceleration: '3.5',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'audi_r8': {
        engine: '5.2L V10',
        horsepower: 562,
        topSpeed: 324,
        acceleration: '3.2',
        doors: 2,
        fuel: 'Premium',
        transmission: 'Automatic',
        drivetrain: 'AWD'
      },
      'chevrolet_corvette': {
        engine: '6.2L V8',
        horsepower: 495,
        topSpeed: 312,
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