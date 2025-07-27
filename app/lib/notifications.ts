import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface NotificationSettings {
  emailNotifications: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  adminEmail: string;
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
      adminEmail: 'admin@dtexoticslv.com'
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

  // Email Templates
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
      return await this.sendEmail(this.settings.adminEmail, template);
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
      return await this.sendEmail(this.settings.adminEmail, template);
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
      return await this.sendEmail(this.settings.adminEmail, template);
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  public async sendTestEmail(type: string): Promise<boolean> {
    const testData = {
      booking: {
        car: { brand: 'Lamborghini', model: 'Huracán', year: 2024 },
        customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1 (555) 123-4567' },
        rentalDates: { startDate: new Date(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        pricing: { finalAmount: 2500, depositAmount: 750 },
        status: 'confirmed'
      },
      payment: {
        amount: 750,
        type: 'Deposit',
        customerName: 'John Doe',
        bookingId: 'TEST-123',
        reason: 'Insufficient funds'
      },
      alert: {
        type: 'Database Connection',
        message: 'Database connection restored after temporary outage',
        details: 'Connection was down for 2 minutes'
      }
    };

    switch (type) {
      case 'booking':
        return await this.sendBookingNotification(testData.booking);
      case 'payment_success':
        return await this.sendPaymentNotification(testData.payment, true);
      case 'payment_failed':
        return await this.sendPaymentNotification(testData.payment, false);
      case 'system':
        return await this.sendSystemAlert(testData.alert);
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
