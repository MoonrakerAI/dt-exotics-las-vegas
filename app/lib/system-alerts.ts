import notificationService from './notifications';

export interface SystemAlert {
  type: string;
  message: string;
  details?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
}

export class SystemAlertManager {
  private static instance: SystemAlertManager;

  private constructor() {}

  public static getInstance(): SystemAlertManager {
    if (!SystemAlertManager.instance) {
      SystemAlertManager.instance = new SystemAlertManager();
    }
    return SystemAlertManager.instance;
  }

  /**
   * Send a system alert notification to admins
   */
  public async sendAlert(alert: SystemAlert): Promise<boolean> {
    try {
      const alertData = {
        type: alert.type,
        message: alert.message,
        details: alert.details || '',
        severity: alert.severity || 'medium',
        timestamp: alert.timestamp || new Date().toISOString()
      };

      console.log(`Sending system alert: ${alert.type} - ${alert.message}`);
      return await notificationService.sendSystemAlert(alertData);
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  /**
   * Database connection error alert
   */
  public async alertDatabaseError(error: any): Promise<void> {
    await this.sendAlert({
      type: 'Database Error',
      message: 'Database connection or query failed',
      details: error instanceof Error ? error.message : String(error),
      severity: 'high'
    });
  }

  /**
   * Payment processing error alert
   */
  public async alertPaymentError(paymentId: string, error: any): Promise<void> {
    await this.sendAlert({
      type: 'Payment Processing Error',
      message: `Payment processing failed for payment ${paymentId}`,
      details: error instanceof Error ? error.message : String(error),
      severity: 'high'
    });
  }

  /**
   * Email delivery failure alert
   */
  public async alertEmailFailure(recipient: string, subject: string, error: any): Promise<void> {
    await this.sendAlert({
      type: 'Email Delivery Failure',
      message: `Failed to send email to ${recipient}`,
      details: `Subject: ${subject}\nError: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'medium'
    });
  }

  /**
   * API rate limit exceeded alert
   */
  public async alertRateLimitExceeded(endpoint: string, ip: string): Promise<void> {
    await this.sendAlert({
      type: 'Rate Limit Exceeded',
      message: `Rate limit exceeded for endpoint ${endpoint}`,
      details: `IP: ${ip}\nEndpoint: ${endpoint}`,
      severity: 'medium'
    });
  }

  /**
   * Stripe webhook verification failure alert
   */
  public async alertWebhookFailure(error: any): Promise<void> {
    await this.sendAlert({
      type: 'Webhook Verification Failed',
      message: 'Stripe webhook signature verification failed',
      details: error instanceof Error ? error.message : String(error),
      severity: 'high'
    });
  }

  /**
   * Car availability sync error alert
   */
  public async alertAvailabilityError(carId: string, error: any): Promise<void> {
    await this.sendAlert({
      type: 'Car Availability Error',
      message: `Failed to update availability for car ${carId}`,
      details: error instanceof Error ? error.message : String(error),
      severity: 'medium'
    });
  }

  /**
   * Rental booking conflict alert
   */
  public async alertBookingConflict(carId: string, dates: string): Promise<void> {
    await this.sendAlert({
      type: 'Booking Conflict Detected',
      message: `Potential booking conflict detected for car ${carId}`,
      details: `Conflicting dates: ${dates}`,
      severity: 'high'
    });
  }

  /**
   * System maintenance alert
   */
  public async alertMaintenance(message: string, details?: string): Promise<void> {
    await this.sendAlert({
      type: 'System Maintenance',
      message,
      details,
      severity: 'low'
    });
  }

  /**
   * Critical system error alert
   */
  public async alertCriticalError(error: any, context?: string): Promise<void> {
    await this.sendAlert({
      type: 'Critical System Error',
      message: 'Critical system error occurred',
      details: `Context: ${context || 'Unknown'}\nError: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'critical'
    });
  }
}

export default SystemAlertManager.getInstance();
