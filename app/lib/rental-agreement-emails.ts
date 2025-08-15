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
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #1a1a1a, #333); padding: 30px; text-align: center;">
            <h1 style="color: #00ffff; margin: 0; font-size: 28px; font-weight: bold;">DT EXOTICS LAS VEGAS</h1>
            <p style="color: #ccc; margin: 10px 0 0 0; font-size: 16px;">Premium Supercar Rentals</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">${data.isReminder ? '⏰ Reminder: ' : ''}Complete Your Rental Agreement</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">📋 Agreement Required</h3>
              <p style="color: #333; line-height: 1.6;">Hi ${data.customerName},</p>
              <p style="color: #333; line-height: 1.6;">
                ${data.isReminder 
                  ? 'This is a friendly reminder that your rental agreement is still pending completion.' 
                  : 'Your rental booking has been confirmed! To finalize your reservation, please complete your rental agreement.'}
              </p>
              
              <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h4 style="color: #0066cc; margin: 0 0 10px 0;">🚗 Rental Details</h4>
                <p style="margin: 5px 0; color: #0066cc;"><strong>Vehicle:</strong> ${data.vehicleInfo}</p>
                <p style="margin: 5px 0; color: #0066cc;"><strong>Rental Period:</strong> ${startDate} - ${endDate}</p>
                <p style="margin: 5px 0; color: #0066cc;"><strong>Booking ID:</strong> ${data.bookingId}</p>
              </div>
              
              ${data.customMessage ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107;">
                  <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Special Instructions</h4>
                  <p style="margin: 0; color: #856404;">${data.customMessage}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.agreementUrl}" 
                 style="display: inline-block; background: #00ffff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 10px;">
                📝 Complete Agreement Now
              </a>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc3545; margin-top: 0;">⚠️ Important Information</h3>
              <ul style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                <li><strong>Agreement expires:</strong> ${expiryDate}</li>
                <li><strong>Required for pickup:</strong> Must be completed before rental</li>
                <li><strong>Digital signature:</strong> Legally binding electronic signature required</li>
                <li><strong>Valid ID required:</strong> Bring driver's license matching agreement</li>
              </ul>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">📋 What's Included in the Agreement</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #0066cc;">
                <li>Personal information and emergency contact</li>
                <li>Driver's license verification</li>
                <li>Insurance and liability acknowledgment</li>
                <li>Vehicle condition acceptance</li>
                <li>Rental terms and conditions</li>
                <li>Digital signature</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Questions about your agreement?</p>
              <div style="display: inline-block; text-align: center;">
                <a href="tel:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px 5px; min-width: 120px; text-align: center;">
                  📞 Call Us
                </a>
                <a href="sms:${formattedBusinessPhone}" 
                   style="display: inline-block; background: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px 5px; min-width: 120px; text-align: center;">
                  💬 Text Us
                </a>
              </div>
              <div style="margin-top: 15px; font-size: 14px; color: #666;">
                <p style="margin: 5px 0;">📞 <a href="tel:${formattedBusinessPhone}" style="color: #00ffff; text-decoration: none;">${formattedBusinessPhone}</a></p>
                <p style="margin: 5px 0;">📧 <a href="mailto:contact@dtexoticslv.com" style="color: #00ffff; text-decoration: none;">contact@dtexoticslv.com</a></p>
              </div>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <img src="https://dtexoticslv.com/images/logo/DT Exotics Logo Icon Black.png" alt="DT Exotics Icon" style="height: 40px; opacity: 0.7;">
            </div>
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">2687 S Sammy Davis Jr Dr, Las Vegas NV 89109, USA</p>
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
2687 S Sammy Davis Jr Dr, Las Vegas NV 89109, USA`
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
