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
  cylinders?: number;
  displacement?: number;
  features?: string[];
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

      // Sort results by relevance (exact year match first, then closest year)
      const sortedData = data.sort((a: any, b: any) => {
        const aYearDiff = Math.abs((a.year || 0) - year);
        const bYearDiff = Math.abs((b.year || 0) - year);
        return aYearDiff - bYearDiff;
      });
      
      // Take the most relevant result
      const vehicleData = sortedData[0];
      
      const vehicleSpecs: VehicleSpecs = {
        make: this.capitalizeWords(vehicleData.make || make),
        model: this.capitalizeWords(vehicleData.model || model),
        year: vehicleData.year || year,
        category: this.inferCategory(vehicleData.make || make, vehicleData.model || model),
        engine: this.formatEngineInfo(vehicleData),
        horsepower: vehicleData.horsepower || undefined,
        fuel: this.formatFuelType(vehicleData.fuel_type),
        transmission: this.formatTransmission(vehicleData.transmission),
        drivetrain: this.formatDrivetrain(vehicleData.drive),
        doors: vehicleData.doors || undefined,
        features: this.getEnhancedFeatures(vehicleData)
      };

      // Handle top speed from API Ninja (convert km/h to MPH if needed)
      if (vehicleData.top_speed) {
        // API Ninja typically returns top speed in km/h, convert to MPH
        vehicleSpecs.topSpeed = this.convertKmhToMph(vehicleData.top_speed);
      }

      // Enhanced performance data integration
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
      
      // Add additional API Ninja specific data
      if (vehicleData.cylinders) {
        vehicleSpecs.cylinders = vehicleData.cylinders;
      }
      if (vehicleData.displacement) {
        vehicleSpecs.displacement = vehicleData.displacement;
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
          features: this.getDefaultFeatures()
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
        features: this.getDefaultFeatures()
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
      features: this.getDefaultFeatures()
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

  // Enhanced formatting methods for API Ninja data
  private formatEngineInfo(vehicleData: any): string | undefined {
    if (!vehicleData.engine_type && !vehicleData.cylinders && !vehicleData.displacement) {
      return undefined;
    }
    
    let engineInfo = '';
    if (vehicleData.displacement) {
      engineInfo += `${vehicleData.displacement}L `;
    }
    if (vehicleData.cylinders) {
      engineInfo += `V${vehicleData.cylinders} `;
    }
    if (vehicleData.engine_type) {
      engineInfo += vehicleData.engine_type;
    }
    
    return engineInfo.trim() || undefined;
  }

  private formatFuelType(fuelType: string | undefined): string | undefined {
    if (!fuelType) return undefined;
    
    const fuelMap: { [key: string]: string } = {
      'gas': 'Gasoline',
      'gasoline': 'Gasoline',
      'petrol': 'Gasoline',
      'diesel': 'Diesel',
      'electric': 'Electric',
      'hybrid': 'Hybrid',
      'plug-in hybrid': 'Plug-in Hybrid',
      'ethanol': 'Ethanol (E85)'
    };
    
    return fuelMap[fuelType.toLowerCase()] || this.capitalizeWords(fuelType);
  }

  private formatTransmission(transmission: string | undefined): string | undefined {
    if (!transmission) return undefined;
    
    const transMap: { [key: string]: string } = {
      'manual': 'Manual',
      'automatic': 'Automatic',
      'cvt': 'CVT',
      'dual-clutch': 'Dual-Clutch',
      'semi-automatic': 'Semi-Automatic',
      'amt': 'Automated Manual'
    };
    
    return transMap[transmission.toLowerCase()] || this.capitalizeWords(transmission);
  }

  private formatDrivetrain(drive: string | undefined): string | undefined {
    if (!drive) return undefined;
    
    const driveMap: { [key: string]: string } = {
      'fwd': 'Front-Wheel Drive',
      'rwd': 'Rear-Wheel Drive',
      'awd': 'All-Wheel Drive',
      '4wd': 'Four-Wheel Drive',
      'front': 'Front-Wheel Drive',
      'rear': 'Rear-Wheel Drive',
      'all': 'All-Wheel Drive'
    };
    
    return driveMap[drive.toLowerCase()] || this.capitalizeWords(drive);
  }

  private getEnhancedFeatures(vehicleData: any): string[] {
    const features = this.getDefaultFeatures();
    
    // Add features based on API Ninja data
    if (vehicleData.fuel_type === 'electric') {
      features.push('Electric Vehicle', 'Zero Emissions', 'Instant Torque');
    }
    
    if (vehicleData.fuel_type === 'hybrid') {
      features.push('Hybrid Technology', 'Fuel Efficient', 'Eco Mode');
    }
    
    if (vehicleData.horsepower && vehicleData.horsepower > 500) {
      features.push('High Performance', 'Track Capable');
    }
    
    if (vehicleData.drive === 'awd' || vehicleData.drive === 'all') {
      features.push('All-Wheel Drive', 'Enhanced Traction');
    }
    
    // Remove duplicates and return
    return [...new Set(features)];
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



  // Get vehicle suggestions for autocomplete
  async getVehicleSuggestions(make: string, model?: string): Promise<{
    makes: string[];
    models: string[];
  }> {
    try {
      const suggestions: { makes: string[]; models: string[] } = { makes: [], models: [] };

      // Enhanced make suggestions with luxury/exotic car prioritization
      if (make.length >= 2) {
        const makeLower = make.toLowerCase();
        
        // Priority luxury/exotic makes that API Ninja handles well
        const luxuryMakes = [
          'Lamborghini', 'Ferrari', 'McLaren', 'Bugatti', 'Koenigsegg',
          'Pagani', 'Aston Martin', 'Bentley', 'Rolls-Royce', 'Maserati',
          'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Acura',
          'Jaguar', 'Land Rover', 'Tesla', 'Lotus', 'Alpine', 'Genesis'
        ];
        
        // First, add matching luxury makes
        const luxuryMatches = luxuryMakes.filter(luxuryMake => 
          luxuryMake.toLowerCase().includes(makeLower)
        );
        suggestions.makes.push(...luxuryMatches);
        
        // If we need more suggestions, get from NHTSA
        if (suggestions.makes.length < 8) {
          try {
            const makeResponse = await fetch(`${this.NHTSA_BASE_URL}/GetAllMakes?format=json`);
            const makeData = await makeResponse.json();
            
            const nhtsaMakes = makeData.Results
              .map((m: any) => m.Make_Name)
              .filter((m: string) => 
                m.toLowerCase().includes(makeLower) && 
                !suggestions.makes.includes(m)
              );
            
            suggestions.makes.push(...nhtsaMakes.slice(0, 8 - suggestions.makes.length));
          } catch (error) {
            // NHTSA failed, continue with luxury makes only
          }
        }
        
        suggestions.makes = suggestions.makes.slice(0, 8);
      }

      // Enhanced model suggestions using API Ninja when possible
      if (make.length >= 2 && model && model.length >= 2) {
        const modelLower = model.toLowerCase();
        
        // Try API Ninja for popular luxury makes first
        const luxuryMakes = ['lamborghini', 'ferrari', 'mclaren', 'porsche', 'bmw', 'mercedes-benz', 'audi'];
        if (this.API_NINJAS_KEY && luxuryMakes.includes(make.toLowerCase())) {
          try {
            // Use API Ninja to get more accurate model suggestions for luxury cars
            const apiNinjaResponse = await fetch(
              `https://api.api-ninjas.com/v1/cars?make=${encodeURIComponent(make)}&limit=50`,
              {
                headers: {
                  'X-Api-Key': this.API_NINJAS_KEY
                },
                signal: AbortSignal.timeout(5000)
              }
            );
            
            if (apiNinjaResponse.ok) {
              const apiNinjaData = await apiNinjaResponse.json();
              const uniqueModels = [...new Set(apiNinjaData.map((car: any) => car.model))] as string[];
              const models = uniqueModels
                .filter((m: string) => m && m.toLowerCase().includes(modelLower))
                .slice(0, 8);
              
              if (models.length > 0) {
                suggestions.models = models;
                return suggestions;
              }
            }
          } catch (error) {
            // API Ninja failed, fall back to NHTSA
          }
        }
        
        // Fallback to NHTSA for model suggestions
        try {
          const modelResponse = await fetch(`${this.NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(make)}?format=json`);
          const modelData = await modelResponse.json();
          
          if (modelData.Results) {
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