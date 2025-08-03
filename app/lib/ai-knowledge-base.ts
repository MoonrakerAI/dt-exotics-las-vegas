import { kv } from '@vercel/kv';
import { Car } from '../data/cars';
import carDB from './car-database';

// Knowledge base keys for Upstash KV storage
const KB_KEYS = {
  FLEET_INFO: 'ai:kb:fleet',
  COMPANY_INFO: 'ai:kb:company',
  PACKAGES_INFO: 'ai:kb:packages',
  SERVICES_INFO: 'ai:kb:services',
  LAST_UPDATED: 'ai:kb:last_updated'
} as const;

export interface AIKnowledgeBase {
  fleetInfo: string;
  companyInfo: string;
  packagesInfo: string;
  servicesInfo: string;
  lastUpdated: string;
}

class AIKnowledgeBaseManager {
  
  /**
   * Generate fleet information string from current car database
   */
  private async generateFleetInfo(): Promise<string> {
    const cars = await carDB.getAllCars();
    const availableCars = cars.filter(car => car.available);
    
    if (availableCars.length === 0) {
      return "## VEHICLE FLEET\nCurrently updating our fleet. Please contact us directly for current vehicle availability.";
    }

    // Group cars by brand for better organization
    const carsByBrand = availableCars.reduce((acc, car) => {
      const brand = car.brand.toUpperCase();
      if (!acc[brand]) acc[brand] = [];
      acc[brand].push(car);
      return acc;
    }, {} as Record<string, Car[]>);

    let fleetInfo = `## COMPLETE VEHICLE FLEET (${availableCars.length} LUXURY VEHICLES)\n\n`;

    // Generate sections for each brand
    for (const [brand, brandCars] of Object.entries(carsByBrand)) {
      fleetInfo += `**${brand} ${this.getBrandCategory(brand)}**\n`;
      
      for (const car of brandCars) {
        fleetInfo += `**${car.year} ${car.brand} ${car.model}**`;
        if (car.category) fleetInfo += ` (${car.category})`;
        fleetInfo += '\n';
        
        // Add performance specs
        fleetInfo += `- ${car.stats.engine}, ${car.stats.horsepower} HP, 0-60 in ${car.stats.acceleration}s, Top Speed ${car.stats.topSpeed} mph\n`;
        
        // Add key features (limit to top 5 for conciseness)
        if (car.features.length > 0) {
          const topFeatures = car.features.slice(0, 5).join(', ');
          fleetInfo += `- Features: ${topFeatures}\n`;
        }
        
        // Add pricing
        fleetInfo += `- Pricing: $${car.price.daily}/day, $${car.price.weekly}/week\n\n`;
      }
    }

    return fleetInfo;
  }

  /**
   * Get brand category for better organization
   */
  private getBrandCategory(brand: string): string {
    const categories: Record<string, string> = {
      'LAMBORGHINI': 'SUPERCARS',
      'FERRARI': 'SUPERCARS',
      'MCLAREN': 'SUPERCARS',
      'PORSCHE': 'SPORTS CARS',
      'AUDI': 'PERFORMANCE',
      'MERCEDES-BENZ': 'LUXURY',
      'BMW': 'PERFORMANCE',
      'CHEVROLET': 'AMERICAN PERFORMANCE',
      'LAND ROVER': 'LUXURY SUV',
      'RANGE ROVER': 'LUXURY SUV'
    };
    return categories[brand] || 'LUXURY VEHICLES';
  }

  /**
   * Get static company information
   */
  private getCompanyInfo(): string {
    return `## COMPANY OVERVIEW
DT Exotics Las Vegas specializes in luxury supercar rentals and VIP experiences in Las Vegas. We create unforgettable memories for special occasions, corporate events, and luxury tourism.

## LOCATION & SERVICE AREA
- Primary Location: Las Vegas, Nevada
- Service Area: Las Vegas Strip, Downtown, and surrounding areas
- Delivery available to hotels, events, and private locations
- Professional meet-and-greet service included`;
  }

  /**
   * Get bachelor party and event packages information
   */
  private getPackagesInfo(): string {
    return `## BACHELOR PARTY PACKAGES

**The Squad Package - $2,999/group**
- 2-3 Supercars for 4 hours
- Professional photography session
- Strip cruise coordination  
- VIP club arrival assistance
- Fuel and insurance included

**The Legend Package - $4,999/group**
- 3-4 Premium supercars for 6 hours
- Professional videographer + photographer
- VIP nightclub table reservation
- Dedicated concierge service
- Custom route planning
- All fuel, insurance, and gratuities included

**The Ultimate Experience - $9,999/group**
- 4-6 Exotic supercars for 8 hours
- Professional film crew (drone footage)
- Private track experience
- Luxury transportation coordination
- VIP dining reservations
- Personal concierge service
- Professional photography & videography

## BIRTHDAY PACKAGES

**Birthday Royalty - $1,999/person**
- Supercar of choice for 4 hours
- Professional photography session
- Birthday surprise coordination
- Personal concierge service
- Fuel and insurance included

**Birthday Legend - $3,499/person**
- Premium supercar for 6 hours
- Professional videographer
- VIP restaurant reservations
- Custom birthday experience
- Dedicated concierge throughout day`;
  }

  /**
   * Get VIP concierge services information
   */
  private getServicesInfo(): string {
    return `## VIP CONCIERGE SERVICES

**Vegas Mogul - $5,000-$7,500/day**
- Lamborghini or McLaren rental
- Luxury watch rental (Rolex/Patek)
- Chef's table dinner for 4
- VIP nightclub table with bottles

**High Roller Weekend - $15,000-$25,000 (3 days)**
- Multiple supercar experiences
- Private jet coordination
- Luxury suite accommodations
- Personal shopping experiences
- 24/7 concierge support

**Corporate Executive - $3,000-$5,000/day**
- Executive vehicle selection
- Airport pickup/dropoff
- Business dinner reservations
- Professional photography
- Meeting coordination support

## ADDITIONAL SERVICES
- Professional photography & videography
- Custom route planning and GPS coordination
- Fuel and comprehensive insurance included
- 24/7 concierge support
- VIP club and restaurant access
- Private event coordination
- Airport pickup and delivery services`;
  }

  /**
   * Update the complete knowledge base in KV storage
   */
  async updateKnowledgeBase(): Promise<void> {
    try {
      const fleetInfo = await this.generateFleetInfo();
      const companyInfo = this.getCompanyInfo();
      const packagesInfo = this.getPackagesInfo();
      const servicesInfo = this.getServicesInfo();
      const lastUpdated = new Date().toISOString();

      // Store each section separately for flexibility
      await Promise.all([
        kv.set(KB_KEYS.FLEET_INFO, fleetInfo),
        kv.set(KB_KEYS.COMPANY_INFO, companyInfo),
        kv.set(KB_KEYS.PACKAGES_INFO, packagesInfo),
        kv.set(KB_KEYS.SERVICES_INFO, servicesInfo),
        kv.set(KB_KEYS.LAST_UPDATED, lastUpdated)
      ]);

      console.log('AI Knowledge Base updated successfully at', lastUpdated);
    } catch (error) {
      console.error('Failed to update AI Knowledge Base:', error);
      throw error;
    }
  }

  /**
   * Get the complete knowledge base from KV storage
   */
  async getKnowledgeBase(): Promise<AIKnowledgeBase | null> {
    try {
      const [fleetInfo, companyInfo, packagesInfo, servicesInfo, lastUpdated] = await Promise.all([
        kv.get<string>(KB_KEYS.FLEET_INFO),
        kv.get<string>(KB_KEYS.COMPANY_INFO),
        kv.get<string>(KB_KEYS.PACKAGES_INFO),
        kv.get<string>(KB_KEYS.SERVICES_INFO),
        kv.get<string>(KB_KEYS.LAST_UPDATED)
      ]);

      if (!fleetInfo || !companyInfo || !packagesInfo || !servicesInfo) {
        return null;
      }

      return {
        fleetInfo,
        companyInfo,
        packagesInfo,
        servicesInfo,
        lastUpdated: lastUpdated || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to get AI Knowledge Base:', error);
      return null;
    }
  }

  /**
   * Generate complete system prompt for AI concierge
   */
  async generateSystemPrompt(): Promise<string> {
    const kb = await this.getKnowledgeBase();
    
    if (!kb) {
      // Fallback to updating and trying again
      await this.updateKnowledgeBase();
      const updatedKb = await this.getKnowledgeBase();
      if (!updatedKb) {
        throw new Error('Failed to generate AI system prompt - knowledge base unavailable');
      }
      return this.buildSystemPrompt(updatedKb);
    }

    return this.buildSystemPrompt(kb);
  }

  /**
   * Build the complete system prompt from knowledge base components
   */
  private buildSystemPrompt(kb: AIKnowledgeBase): string {
    return `You are an AI concierge for DT Exotics Las Vegas, a premium luxury supercar rental company in Las Vegas. Provide accurate information based only on what's available on our website. Be professional, enthusiastic, and helpful.

${kb.companyInfo}

${kb.fleetInfo}

${kb.packagesInfo}

${kb.servicesInfo}

## IMPORTANT GUIDELINES
- Always provide accurate pricing and availability information
- Emphasize the luxury experience and professional service
- Suggest appropriate packages based on customer needs
- Mention that all rentals include fuel and comprehensive insurance
- Highlight unique features like professional photography and concierge services
- For specific availability, always recommend contacting directly for real-time information

## RESPONSE STYLE
- Be enthusiastic but professional
- Use luxury-focused language
- Provide specific details when available
- Always end with a call to action (booking, contact, or questions)

Knowledge Base Last Updated: ${kb.lastUpdated}`;
  }

  /**
   * Get fallback system prompt if KV is unavailable
   */
  getFallbackSystemPrompt(): string {
    return `You are an AI concierge for DT Exotics Las Vegas, a premium luxury supercar rental company in Las Vegas. We specialize in luxury supercar rentals and VIP experiences.

## COMPANY OVERVIEW
DT Exotics Las Vegas specializes in luxury supercar rentals and VIP experiences in Las Vegas. We create unforgettable memories for special occasions, corporate events, and luxury tourism.

## CURRENT FLEET
We maintain a premium fleet of luxury supercars including Lamborghini, Porsche, Audi, Mercedes-Benz, and American performance vehicles. For current availability and specific vehicle information, please contact us directly.

## SERVICES
- Luxury supercar rentals (daily and weekly rates)
- Bachelor party packages
- Birthday celebration packages  
- Corporate event services
- VIP concierge experiences
- Professional photography and videography
- Custom route planning and coordination

Please contact us directly for current fleet availability, specific pricing, and to book your luxury experience.

Note: Knowledge base is currently being updated. Contact directly for the most current information.`;
  }
}

// Export singleton instance
const aiKB = new AIKnowledgeBaseManager();
export default aiKB;
