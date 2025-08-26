import { EmailTemplate } from './notifications';

export interface RentalAgreementEmailData {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  agreementUrl: string;
  expiresAt: string;
  vehicleInfo: string;
  rentalDates: { startDate: string; endDate: string };
  customMessage?: string;
  isReminder?: boolean;
}

export interface RentalAgreementCompletedData {
  bookingId: string;
  agreementId: string;
  customerName: string;
  vehicleInfo: string;
  rentalDates: { startDate: string; endDate: string };
  completedAt: string;
}

export class RentalAgreementEmailService {
  private static formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as +1 XXX-XXX-XXXX
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone; // Return original if formatting fails
  }

  public static getRentalAgreementEmailTemplate(data: RentalAgreementEmailData): EmailTemplate {
    const formattedBusinessPhone = this.formatPhoneNumber('+17025180924');
    const expiryDate = new Date(data.expiresAt).toLocaleDateString();
    const startDate = new Date(data.rentalDates.startDate).toLocaleDateString();
    const endDate = new Date(data.rentalDates.endDate).toLocaleDateString();
    
    const subject = data.isReminder 
      ? `Reminder: Complete Your Rental Agreement - ${data.vehicleInfo}`
      : `Complete Your Rental Agreement - ${data.vehicleInfo}`;

    return {
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="width: 300px; max-width: 100%; height: auto; margin-bottom: 20px;">
            <h1 style="color: #00ffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">${data.isReminder ? 'Agreement Reminder' : 'Complete Your Agreement'}</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Rental Agreement Required</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <!-- Greeting & Main Message -->
            <div style="margin-bottom: 30px;">
              <p style="color: #333; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">Hi ${data.customerName},</p>
              <p style="color: #333; margin: 0; font-size: 16px; line-height: 1.6;">
                ${data.isReminder 
                  ? 'This is a friendly reminder that your rental agreement is still pending completion. Please complete it to finalize your reservation.' 
                  : 'Your rental booking has been confirmed! To finalize your reservation, please complete your rental agreement.'}
              </p>
            </div>

            <!-- Rental Details -->
            <div style="background: #f8f8f8; padding: 20px; border-left: 4px solid #00ffff; margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">🚗 Rental Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Vehicle:</td><td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${data.vehicleInfo}</td></tr>
                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Rental Period:</td><td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${startDate} - ${endDate}</td></tr>
                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Booking ID:</td><td style="padding: 8px 0; color: #333; font-weight: 500; font-size: 14px;">${data.bookingId}</td></tr>
                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Expires:</td><td style="padding: 8px 0; color: #d32f2f; font-weight: 600; font-size: 14px;">${expiryDate}</td></tr>
              </table>
            </div>

            ${data.customMessage ? `
            <!-- Special Instructions -->
            <div style="background: #fff8e1; padding: 20px; border-radius: 4px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
              <h3 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px; font-weight: 500;">📝 Special Instructions</h3>
              <p style="margin: 0; color: #5d4037; font-size: 14px; line-height: 1.6;">${data.customMessage}</p>
            </div>
            ` : ''}

            <!-- Main CTA -->
            <div style="text-align: center; padding: 30px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
              <a href="${data.agreementUrl}" 
                 style="display: inline-block; background: #00ffff; color: #000000; padding: 18px 36px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 18px; letter-spacing: 0.5px;">
                📝 Complete Agreement Now
              </a>
              <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">Required before pickup - expires ${expiryDate}</p>
            </div>

            <!-- Contact Buttons -->
            <div style="text-align: center; padding: 20px 0;">
              <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">Questions about your agreement?</p>
              <div>
                <a href="tel:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #00ffff; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 5px; font-size: 14px; letter-spacing: 0.5px;">
                  📞 Call Us
                </a>
                <a href="sms:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #00ffff; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 5px; font-size: 14px; letter-spacing: 0.5px;">
                  💬 Text Us
                </a>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <img src="https://dtexoticslv.com/images/logo/DT Exotics Logo Icon Black.png" alt="DT Exotics" style="width: 100px; height: auto; margin-bottom: 15px;">
            <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">DT Exotics Las Vegas</p>
            <p style="color: #999; margin: 0; font-size: 12px;">Premium Supercar Rentals</p>
          </div>
        </div>
      `,
      text: `Complete Your Rental Agreement - ${data.vehicleInfo}

Hi ${data.customerName},

${data.isReminder 
  ? 'This is a friendly reminder that your rental agreement is still pending completion.' 
  : 'Your rental booking has been confirmed! To finalize your reservation, please complete your rental agreement.'}

Rental Details:
- Vehicle: ${data.vehicleInfo}
- Rental Period: ${startDate} - ${endDate}
- Booking ID: ${data.bookingId}

${data.customMessage ? `Special Instructions: ${data.customMessage}` : ''}

Complete your agreement: ${data.agreementUrl}

Important Information:
- Agreement expires: ${expiryDate}
- Required for pickup: Must be completed before rental
- Digital signature: Legally binding electronic signature required
- Valid ID required: Bring driver's license matching agreement

What's Included in the Agreement:
- Personal information and emergency contact
- Driver's license verification
- Insurance and liability acknowledgment
- Vehicle condition acceptance
- Rental terms and conditions
- Digital signature

Questions? Contact us:
Phone: ${formattedBusinessPhone}
Email: contact@dtexoticslv.com

DT Exotics Las Vegas - Premium Supercar Rentals
9620 Las Vegas Blvd S STE E4 #508, Las Vegas NV 89123, USA`
    };
  }

  public static getRentalAgreementCompletedTemplate(data: RentalAgreementCompletedData): EmailTemplate {
    const formattedBusinessPhone = this.formatPhoneNumber('+17025180924');
    const startDate = new Date(data.rentalDates.startDate).toLocaleDateString();
    const endDate = new Date(data.rentalDates.endDate).toLocaleDateString();
    const completedDate = new Date(data.completedAt).toLocaleString();

    return {
      subject: `✅ Rental Agreement Completed - ${data.customerName} (${data.vehicleInfo})`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #1a1a1a, #333); padding: 30px; text-align: center;">
            <h1 style="color: #00ffff; margin: 0; font-size: 28px; font-weight: bold;">DT EXOTICS LAS VEGAS</h1>
            <p style="color: #ccc; margin: 10px 0 0 0; font-size: 16px;">Admin Notification</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">✅ Rental Agreement Completed</h2>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">🎉 Agreement Successfully Signed</h3>
              <p style="color: #155724; line-height: 1.6;">
                <strong>${data.customerName}</strong> has completed and digitally signed their rental agreement.
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">📋 Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${data.customerName}</p>
              <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleInfo}</p>
              <p style="margin: 5px 0;"><strong>Rental Period:</strong> ${startDate} - ${endDate}</p>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Agreement ID:</strong> ${data.agreementId}</p>
              <p style="margin: 5px 0;"><strong>Completed:</strong> ${completedDate}</p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">📝 Next Steps</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #0066cc;">
                <li>Review the completed agreement in the admin panel</li>
                <li>Verify all customer information is accurate</li>
                <li>Prepare vehicle for pickup on ${startDate}</li>
                <li>Ensure all required documentation is ready</li>
                <li>Contact customer if any clarification is needed</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://dtexoticslv.com'}/admin/bookings" 
                 style="display: inline-block; background: #00ffff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px;">
                📊 View in Admin Panel
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Quick Actions:</p>
              <div style="display: inline-block; text-align: center;">
                <a href="tel:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px 5px; min-width: 120px; text-align: center;">
                  📞 Call Office
                </a>
                <a href="sms:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px 5px; min-width: 120px; text-align: center;">
                  💬 Text Team
                </a>
              </div>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <img src="https://dtexoticslv.com/images/logo/DT Exotics Logo Icon Black.png" alt="DT Exotics Icon" style="height: 40px; opacity: 0.7;">
            </div>
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Admin System</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Rental agreement completed successfully!</p>
          </div>
        </div>
      `,
      text: `Rental Agreement Completed - ${data.customerName} (${data.vehicleInfo})

${data.customerName} has completed and digitally signed their rental agreement.

Booking Details:
- Customer: ${data.customerName}
- Vehicle: ${data.vehicleInfo}
- Rental Period: ${startDate} - ${endDate}
- Booking ID: ${data.bookingId}
- Agreement ID: ${data.agreementId}
- Completed: ${completedDate}

Next Steps:
- Review the completed agreement in the admin panel
- Verify all customer information is accurate
- Prepare vehicle for pickup on ${startDate}
- Ensure all required documentation is ready
- Contact customer if any clarification is needed

View in Admin Panel: ${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://dtexoticslv.com'}/admin/bookings

DT Exotics Las Vegas - Admin System
Rental agreement completed successfully!`
    };
  }
}
