import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface NotificationSettings {
  emailNotifications: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  adminEmails: string[];
  // Keep adminEmail for backward compatibility
  adminEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;

  private constructor() {
    this.settings = {
      emailNotifications: true,
      bookingAlerts: true,
      paymentAlerts: true,
      systemAlerts: true,
      adminEmails: ['admin@dtexoticslv.com'],
      adminEmail: 'admin@dtexoticslv.com' // Backward compatibility
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Helper method to get admin emails for notifications
  private getAdminEmails(): string[] {
    // If adminEmails array exists and has emails, use it
    if (this.settings.adminEmails && this.settings.adminEmails.length > 0) {
      return this.settings.adminEmails;
    }
    // Fallback to single adminEmail for backward compatibility
    if (this.settings.adminEmail) {
      return [this.settings.adminEmail];
    }
    // Default fallback
    return ['admin@dtexoticslv.com'];
  }

  // Helper method to send email to multiple recipients
  private async sendEmailToAdmins(template: EmailTemplate): Promise<boolean> {
    const adminEmails = this.getAdminEmails();
    const results = await Promise.allSettled(
      adminEmails.map(email => this.sendEmail(email, template))
    );
    
    // Return true if at least one email was sent successfully
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }

  // Admin Email Templates
  private getBookingConfirmationTemplate(booking: any): EmailTemplate {
    return {
      subject: `New Booking Confirmed - ${booking.car.brand} ${booking.car.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ffff; margin: 0; font-size: 28px;">New Booking Confirmed!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Booking Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">Vehicle</h3>
              <p style="margin: 5px 0; font-size: 16px;"><strong>${booking.car.brand} ${booking.car.model} (${booking.car.year})</strong></p>
              
              <h3 style="color: #00ffff; margin-top: 20px;">Customer</h3>
              <p style="margin: 5px 0;">${booking.customer.firstName} ${booking.customer.lastName}</p>
              <p style="margin: 5px 0;">${booking.customer.email}</p>
              <p style="margin: 5px 0;">${booking.customer.phone}</p>
              
              <h3 style="color: #00ffff; margin-top: 20px;">Rental Period</h3>
              <p style="margin: 5px 0;"><strong>Start:</strong> ${new Date(booking.rentalDates.startDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>End:</strong> ${new Date(booking.rentalDates.endDate).toLocaleDateString()}</p>
              
              <h3 style="color: #00ffff; margin-top: 20px;">Payment</h3>
              <p style="margin: 5px 0;"><strong>Total:</strong> $${booking.pricing.finalAmount}</p>
              <p style="margin: 5px 0;"><strong>Deposit:</strong> $${booking.pricing.depositAmount}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${booking.status}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://dtexoticslv.com/admin/bookings" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
      text: `New Booking Confirmed!
      
Vehicle: ${booking.car.brand} ${booking.car.model} (${booking.car.year})
Customer: ${booking.customer.firstName} ${booking.customer.lastName}
Email: ${booking.customer.email}
Phone: ${booking.customer.phone}
Start Date: ${new Date(booking.rentalDates.startDate).toLocaleDateString()}
End Date: ${new Date(booking.rentalDates.endDate).toLocaleDateString()}
Total: $${booking.pricing.finalAmount}
Deposit: $${booking.pricing.depositAmount}
Status: ${booking.status}

View in Admin Dashboard: https://dtexoticslv.com/admin/bookings`
    };
  }

  private getPaymentSuccessTemplate(payment: any): EmailTemplate {
    return {
      subject: `Payment Successful - $${payment.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ff00; margin: 0; font-size: 28px;">Payment Successful!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ff00; margin-top: 0;">Payment Details</h3>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${payment.amount}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${payment.type}</p>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${payment.customerName}</p>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${payment.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `,
      text: `Payment Successful!
      
Amount: $${payment.amount}
Type: ${payment.type}
Customer: ${payment.customerName}
Booking ID: ${payment.bookingId}
Time: ${new Date().toLocaleString()}`
    };
  }

  private getPaymentFailedTemplate(payment: any): EmailTemplate {
    return {
      subject: `Payment Failed - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #ff0000; margin: 0; font-size: 28px;">Payment Failed</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff0000;">
              <h3 style="color: #ff0000; margin-top: 0;">Failed Payment Details</h3>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${payment.amount}</p>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${payment.customerName}</p>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${payment.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${payment.reason || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://dtexoticslv.com/admin/bookings" 
                 style="background: #ff0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Review Booking
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Payment Failed - Action Required
      
Amount: $${payment.amount}
Customer: ${payment.customerName}
Booking ID: ${payment.bookingId}
Reason: ${payment.reason || 'Unknown'}
Time: ${new Date().toLocaleString()}

Review Booking: https://dtexoticslv.com/admin/bookings`
    };
  }

  private getSystemAlertTemplate(alert: any): EmailTemplate {
    return {
      subject: `System Alert: ${alert.type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #ffa500; margin: 0; font-size: 28px;">System Alert</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffa500;">
              <h3 style="color: #ffa500; margin-top: 0;">${alert.type}</h3>
              <p style="margin: 10px 0; font-size: 16px;">${alert.message}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              ${alert.details ? `<p style="margin: 10px 0; color: #666;"><strong>Details:</strong> ${alert.details}</p>` : ''}
            </div>
          </div>
        </div>
      `,
      text: `System Alert: ${alert.type}
      
${alert.message}
Time: ${new Date().toLocaleString()}
${alert.details ? `Details: ${alert.details}` : ''}`
    };
  }

  // Main notification methods
  public async sendBookingNotification(booking: any): Promise<boolean> {
    if (!this.settings.emailNotifications || !this.settings.bookingAlerts) {
      return false;
    }

    try {
      const template = this.getBookingConfirmationTemplate(booking);
      return await this.sendEmailToAdmins(template);
    } catch (error) {
      console.error('Failed to send booking notification:', error);
      return false;
    }
  }

  public async sendPaymentNotification(payment: any, success: boolean): Promise<boolean> {
    if (!this.settings.emailNotifications || !this.settings.paymentAlerts) {
      return false;
    }

    try {
      const template = success 
        ? this.getPaymentSuccessTemplate(payment)
        : this.getPaymentFailedTemplate(payment);
      return await this.sendEmailToAdmins(template);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      return false;
    }
  }

  public async sendSystemAlert(alert: any): Promise<boolean> {
    if (!this.settings.emailNotifications || !this.settings.systemAlerts) {
      return false;
    }

    try {
      const template = this.getSystemAlertTemplate(alert);
      return await this.sendEmailToAdmins(template);
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  // Customer Email Templates
  private getCustomerBookingConfirmationTemplate(booking: any): EmailTemplate {
    return {
      subject: `Booking Confirmed - Your ${booking.car.brand} ${booking.car.model} Rental`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ffff; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">Thank you for choosing DT Exotics Las Vegas</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Your Rental Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00ffff;">
              <h3 style="color: #00ffff; margin-top: 0;">Vehicle</h3>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${booking.car.brand} ${booking.car.model} (${booking.car.year})</p>
              
              <h3 style="color: #00ffff; margin-top: 20px;">Rental Period</h3>
              <p style="margin: 5px 0;"><strong>Pickup:</strong> ${new Date(booking.rentalDates.startDate).toLocaleDateString()} at 10:00 AM</p>
              <p style="margin: 5px 0;"><strong>Return:</strong> ${new Date(booking.rentalDates.endDate).toLocaleDateString()} at 6:00 PM</p>
              
              <h3 style="color: #00ffff; margin-top: 20px;">Payment Summary</h3>
              <p style="margin: 5px 0;"><strong>Total Rental:</strong> $${booking.pricing.finalAmount}</p>
              <p style="margin: 5px 0;"><strong>Deposit Paid:</strong> $${booking.pricing.depositAmount}</p>
              <p style="margin: 5px 0; color: #28a745;"><strong>Remaining Balance:</strong> $${booking.pricing.finalAmount - booking.pricing.depositAmount} (due at pickup)</p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">📍 Pickup Location</h3>
              <p style="margin: 5px 0; font-weight: bold;">DT Exotics Las Vegas</p>
              <p style="margin: 5px 0;">Las Vegas, NV</p>
              <p style="margin: 5px 0;">Phone: +1 (702) 518-0924</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Important Reminders</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                <li>Bring a valid driver's license and credit card</li>
                <li>Must be 25+ years old to rent</li>
                <li>Vehicle inspection will be conducted at pickup and return</li>
                <li>Full insurance coverage is included</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Questions about your rental?</p>
              <a href="tel:+17025180924" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Call Us
              </a>
              <a href="sms:+17025180924" 
                 style="background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Text Us
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">This email was sent regarding your booking confirmation.</p>
          </div>
        </div>
      `,
      text: `Booking Confirmed - ${booking.car.brand} ${booking.car.model}
      
Thank you for choosing DT Exotics Las Vegas!

Vehicle: ${booking.car.brand} ${booking.car.model} (${booking.car.year})
Pickup: ${new Date(booking.rentalDates.startDate).toLocaleDateString()} at 10:00 AM
Return: ${new Date(booking.rentalDates.endDate).toLocaleDateString()} at 6:00 PM

Payment Summary:
Total Rental: $${booking.pricing.finalAmount}
Deposit Paid: $${booking.pricing.depositAmount}
Remaining Balance: $${booking.pricing.finalAmount - booking.pricing.depositAmount} (due at pickup)

Pickup Location:
DT Exotics Las Vegas
Las Vegas, NV
Phone: +1 (702) 518-0924

Important Reminders:
- Bring a valid driver's license and credit card
- Must be 25+ years old to rent
- Vehicle inspection will be conducted at pickup and return
- Full insurance coverage is included

Questions? Call or text us at +1 (702) 518-0924`
    };
  }

  private getCustomerPaymentReceiptTemplate(payment: any): EmailTemplate {
    return {
      subject: `Payment Receipt - $${payment.amount} for ${payment.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ff00; margin: 0; font-size: 28px;">Payment Received!</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">Thank you for your payment</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00ff00;">
              <h3 style="color: #00ff00; margin-top: 0;">Payment Details</h3>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${payment.amount}</p>
              <p style="margin: 5px 0;"><strong>Payment Type:</strong> ${payment.type}</p>
              <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${payment.vehicleName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${payment.transactionId}</p>
            </div>
            
            ${payment.type === 'Deposit' ? `
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">💳 Deposit Received!</h3>
              <p style="margin: 10px 0;">Thank you for your deposit payment. Our team will review your request and confirm your booking shortly.</p>
              <p style="margin: 10px 0;"><strong>Remaining balance of $${payment.remainingBalance} will be due at pickup.</strong></p>
              <p style="margin: 10px 0; font-size: 14px; color: #666;">You'll receive a separate confirmation email once your booking is approved by our team.</p>
            </div>
            ` : `
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ Payment Complete!</h3>
              <p style="margin: 10px 0;">Your rental is fully paid. Enjoy your luxury driving experience!</p>
            </div>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Need assistance?</p>
              <a href="tel:+17025180924" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Contact Support
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Keep this receipt for your records.</p>
          </div>
        </div>
      `,
      text: `Payment Receipt - $${payment.amount}
      
Thank you for your payment!

Payment Details:
Amount: $${payment.amount}
Payment Type: ${payment.type}
Vehicle: ${payment.vehicleName}
Date: ${new Date().toLocaleDateString()}
Transaction ID: ${payment.transactionId}

${payment.type === 'Deposit' ? `Thank you for your deposit payment. Our team will review your request and confirm your booking shortly. Remaining balance of $${payment.remainingBalance} will be due at pickup.

You'll receive a separate confirmation email once your booking is approved by our team.` : 'Your rental is fully paid. Enjoy your luxury driving experience!'}

Need assistance? Call us at +1 (702) 518-0924

DT Exotics Las Vegas - Premium Supercar Rentals`
    };
  }

  private getCustomerPaymentFailedTemplate(payment: any): EmailTemplate {
    return {
      subject: `Payment Issue - Action Required for Your ${payment.vehicleName} Rental`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #ff6b6b; margin: 0; font-size: 28px;">Payment Issue</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">We need your help to complete your booking</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #ff6b6b; margin-top: 0;">Payment Could Not Be Processed</h3>
              <p style="margin: 10px 0;">We encountered an issue processing your payment for the <strong>${payment.vehicleName}</strong> rental.</p>
              <p style="margin: 10px 0;"><strong>Amount:</strong> $${payment.amount}</p>
              <p style="margin: 10px 0;"><strong>Reason:</strong> ${payment.reason || 'Payment method declined'}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">⏰ Deposit Required</h3>
              <p style="margin: 10px 0;">Don't worry - your vehicle is still available! We just need you to complete your deposit payment to begin the booking process.</p>
              <p style="margin: 10px 0;"><strong>Please contact us within 24 hours to complete your deposit and secure your reservation.</strong></p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Ready to complete your deposit?</p>
              <a href="tel:+17025180924" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Call Now
              </a>
              <a href="sms:+17025180924" 
                 style="background: #ff6b6b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Text Us
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">We're here to help complete your luxury rental experience.</p>
          </div>
        </div>
      `,
      text: `Payment Issue - Action Required
      
We encountered an issue processing your payment for the ${payment.vehicleName} rental.

Amount: $${payment.amount}
Reason: ${payment.reason || 'Payment method declined'}

Deposit Required:
Don't worry - your vehicle is still available! We just need you to complete your deposit payment to begin the booking process.

Please contact us within 24 hours to complete your deposit and secure your reservation.

Call: +1 (702) 518-0924
Text: +1 (702) 518-0924

DT Exotics Las Vegas - Premium Supercar Rentals`
    };
  }

  private getCustomerReminderTemplate(booking: any): EmailTemplate {
    return {
      subject: `Reminder: Your ${booking.car.brand} ${booking.car.model} pickup is tomorrow!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #ffd700; margin: 0; font-size: 28px;">Almost Time!</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">Your luxury rental pickup is tomorrow</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffd700;">
              <h3 style="color: #ffd700; margin-top: 0;">🚗 Tomorrow's Pickup</h3>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${booking.car.brand} ${booking.car.model} (${booking.car.year})</p>
              <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(booking.rentalDates.startDate).toLocaleDateString()}</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> 10:00 AM</p>
              <p style="margin: 10px 0;"><strong>Location:</strong> DT Exotics Las Vegas</p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">📋 Pickup Checklist</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #0066cc;">
                <li><strong>Valid Driver's License</strong> (must be 25+)</li>
                <li><strong>Credit Card</strong> (for security deposit)</li>
                <li><strong>Remaining Balance:</strong> $${booking.pricing.finalAmount - booking.pricing.depositAmount}</li>
                <li><strong>Arrive 15 minutes early</strong> for vehicle inspection</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Questions or need to reschedule?</p>
              <a href="tel:+17025180924" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Call Us Now
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">We can't wait to see you tomorrow!</p>
          </div>
        </div>
      `,
      text: `Reminder: Your ${booking.car.brand} ${booking.car.model} pickup is tomorrow!
      
Pickup Details:
Vehicle: ${booking.car.brand} ${booking.car.model} (${booking.car.year})
Date: ${new Date(booking.rentalDates.startDate).toLocaleDateString()}
Time: 10:00 AM
Location: DT Exotics Las Vegas

Pickup Checklist:
- Valid Driver's License (must be 25+)
- Credit Card (for security deposit)
- Remaining Balance: $${booking.pricing.finalAmount - booking.pricing.depositAmount}
- Arrive 15 minutes early for vehicle inspection

Questions or need to reschedule? Call us at +1 (702) 518-0924

DT Exotics Las Vegas - We can't wait to see you tomorrow!`
    };
  }

  private getCustomerBookingConfirmedTemplate(booking: any): EmailTemplate {
    return {
      subject: `🎉 Booking Confirmed - Your ${booking.car.brand} ${booking.car.model} is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ff00; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">Your luxury rental is officially confirmed</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00ff00;">
              <h3 style="color: #155724; margin-top: 0;">✅ You're All Set!</h3>
              <p style="margin: 10px 0;">Great news! Our team has reviewed and confirmed your booking. Your <strong>${booking.car.brand} ${booking.car.model}</strong> is reserved and ready for your adventure!</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${booking.car.brand} ${booking.car.model} (${booking.car.year})</p>
              <p style="margin: 5px 0;"><strong>Pickup Date:</strong> ${new Date(booking.rentalDates.startDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Return Date:</strong> ${new Date(booking.rentalDates.endDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${booking.pricing.finalAmount}</p>
              <p style="margin: 5px 0;"><strong>Deposit Paid:</strong> $${booking.pricing.depositAmount}</p>
              <p style="margin: 5px 0;"><strong>Balance Due at Pickup:</strong> $${booking.pricing.finalAmount - booking.pricing.depositAmount}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">📋 Next Steps</h3>
              <p style="margin: 10px 0;">1. <strong>Bring valid driver's license</strong> and credit card for security deposit</p>
              <p style="margin: 10px 0;">2. <strong>Arrive 15 minutes early</strong> for vehicle inspection and paperwork</p>
              <p style="margin: 10px 0;">3. <strong>Complete remaining balance</strong> of $${booking.pricing.finalAmount - booking.pricing.depositAmount} at pickup</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Questions about your booking?</p>
              <a href="tel:+17025180924" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Call Us
              </a>
              <a href="sms:+17025180924" 
                 style="background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Text Us
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">DT Exotics Las Vegas - Premium Supercar Rentals</p>
            <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Get ready for the drive of a lifetime!</p>
          </div>
        </div>
      `,
      text: `Booking Confirmed!
      
Great news! Our team has reviewed and confirmed your booking. Your ${booking.car.brand} ${booking.car.model} is reserved and ready for your adventure!

Booking Details:
Vehicle: ${booking.car.brand} ${booking.car.model} (${booking.car.year})
Pickup Date: ${new Date(booking.rentalDates.startDate).toLocaleDateString()}
Return Date: ${new Date(booking.rentalDates.endDate).toLocaleDateString()}
Total Amount: $${booking.pricing.finalAmount}
Deposit Paid: $${booking.pricing.depositAmount}
Balance Due at Pickup: $${booking.pricing.finalAmount - booking.pricing.depositAmount}

Next Steps:
1. Bring valid driver's license and credit card for security deposit
2. Arrive 15 minutes early for vehicle inspection and paperwork
3. Complete remaining balance of $${booking.pricing.finalAmount - booking.pricing.depositAmount} at pickup

Questions? Call us at +1 (702) 518-0924 or text us!

DT Exotics Las Vegas - Premium Supercar Rentals
Get ready for the drive of a lifetime!`
    };
  }

  // Customer notification methods
  public async sendCustomerBookingConfirmation(booking: any): Promise<boolean> {
    try {
      const template = this.getCustomerBookingConfirmationTemplate(booking);
      return await this.sendEmail(booking.customer.email, template);
    } catch (error) {
      console.error('Failed to send customer booking confirmation:', error);
      return false;
    }
  }

  public async sendCustomerPaymentReceipt(payment: any): Promise<boolean> {
    try {
      const template = this.getCustomerPaymentReceiptTemplate(payment);
      return await this.sendEmail(payment.customerEmail, template);
    } catch (error) {
      console.error('Failed to send customer payment receipt:', error);
      return false;
    }
  }

  public async sendCustomerPaymentFailed(payment: any): Promise<boolean> {
    try {
      const template = this.getCustomerPaymentFailedTemplate(payment);
      return await this.sendEmail(payment.customerEmail, template);
    } catch (error) {
      console.error('Failed to send customer payment failed notification:', error);
      return false;
    }
  }

  public async sendCustomerReminder(booking: any): Promise<boolean> {
    try {
      const template = this.getCustomerReminderTemplate(booking);
      return await this.sendEmail(booking.customer.email, template);
    } catch (error) {
      console.error('Failed to send customer reminder:', error);
      return false;
    }
  }

  public async sendCustomerBookingConfirmed(booking: any): Promise<boolean> {
    try {
      const template = this.getCustomerBookingConfirmedTemplate(booking);
      return await this.sendEmail(booking.customer.email, template);
    } catch (error) {
      console.error('Failed to send customer booking confirmed notification:', error);
      return false;
    }
  }

  private getEventInquiryTemplate(inquiry: any): EmailTemplate {
    return {
      subject: `New ${inquiry.eventType} Inquiry - ${inquiry.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <img src="https://dtexoticslv.com/images/logo/dt-exotics-logo.png" alt="DT Exotics" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #00ffff; margin: 0; font-size: 28px;">New Event Inquiry!</h1>
            <p style="color: #ffffff; margin: 10px 0; font-size: 16px;">${inquiry.eventType} Request</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Customer Information</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">Contact Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${inquiry.customerName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${inquiry.customerEmail}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${inquiry.customerPhone}</p>
              <p style="margin: 5px 0;"><strong>Event Type:</strong> ${inquiry.eventType}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(inquiry.submittedAt).toLocaleString()}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00ffff; margin-top: 0;">Event Details</h3>
              ${Object.entries(inquiry.formData)
                .filter(([key]) => !['fullName', 'email', 'phone'].includes(key))
                .map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                  return `<p style="margin: 5px 0;"><strong>${label}:</strong> ${value || 'Not specified'}</p>`
                }).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="tel:${inquiry.customerPhone}" 
                 style="background: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Call Customer
              </a>
              <a href="mailto:${inquiry.customerEmail}" 
                 style="background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Email Customer
              </a>
            </div>
          </div>
        </div>
      `,
      text: `New ${inquiry.eventType} Inquiry!
      
Customer Information:
Name: ${inquiry.customerName}
Email: ${inquiry.customerEmail}
Phone: ${inquiry.customerPhone}
Event Type: ${inquiry.eventType}
Submitted: ${new Date(inquiry.submittedAt).toLocaleString()}

Event Details:
${Object.entries(inquiry.formData)
  .filter(([key]) => !['fullName', 'email', 'phone'].includes(key))
  .map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    return `${label}: ${value || 'Not specified'}`
  }).join('\n')}

Contact customer at: ${inquiry.customerPhone} or ${inquiry.customerEmail}`
    };
  }

  public async sendEventInquiry(inquiry: any): Promise<boolean> {
    if (!this.settings.emailNotifications) {
      return false;
    }

    try {
      const template = this.getEventInquiryTemplate(inquiry);
      return await this.sendEmailToAdmins(template);
    } catch (error) {
      console.error('Failed to send event inquiry notification:', error);
      return false;
    }
  }

  public async sendTestEmail(type: string): Promise<boolean> {
    // Get the first admin email for admin test emails
    const firstAdminEmail = this.getAdminEmails()[0];
    
    const testData = {
      booking: {
        car: { brand: 'Lamborghini', model: 'Huracán', year: 2024 },
        customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1 (555) 123-4567' },
        rentalDates: { startDate: new Date(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        pricing: { finalAmount: 2500, depositAmount: 750 },
        status: 'confirmed'
      },
      // Payment data for admin notifications
      adminPayment: {
        amount: 750,
        type: 'Deposit',
        customerName: 'John Doe',
        customerEmail: firstAdminEmail,
        bookingId: 'TEST-123',
        reason: 'Insufficient funds',
        vehicleName: 'Lamborghini Huracán',
        transactionId: 'TXN-' + Date.now(),
        remainingBalance: 1750
      },
      // Payment data for customer notifications (consistent structure)
      customerPayment: {
        amount: 750,
        type: 'Deposit',
        customerName: 'John Doe',
        customerEmail: 'john@example.com', // Customer email for customer notifications
        bookingId: 'TEST-123',
        reason: 'Insufficient funds',
        vehicleName: 'Lamborghini Huracán',
        transactionId: 'TXN-' + Date.now(),
        remainingBalance: 1750
      },
      alert: {
        type: 'Database Connection',
        message: 'Database connection restored after temporary outage',
        details: 'Connection was down for 2 minutes'
      }
    };

    switch (type) {
      // Admin notifications
      case 'booking':
        return await this.sendBookingNotification(testData.booking);
      case 'payment_success':
        return await this.sendPaymentNotification(testData.adminPayment, true);
      case 'payment_failed':
        return await this.sendPaymentNotification(testData.adminPayment, false);
      case 'system':
        return await this.sendSystemAlert(testData.alert);
      
      // Customer notifications
      case 'customer_booking':
        return await this.sendCustomerBookingConfirmation(testData.booking);
      case 'customer_payment_success':
        return await this.sendCustomerPaymentReceipt(testData.customerPayment);
      case 'customer_payment_failed':
        return await this.sendCustomerPaymentFailed(testData.customerPayment);
      case 'customer_reminder':
        return await this.sendCustomerReminder(testData.booking);
      case 'customer_booking_confirmed':
        return await this.sendCustomerBookingConfirmed(testData.booking);
      
      default:
        return false;
    }
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!resend) {
      console.error('Resend not configured - missing API key');
      return false;
    }

    try {
      const result = await resend.emails.send({
        from: 'DT Exotics <notifications@dtexoticslv.com>',
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

export default NotificationService.getInstance();
