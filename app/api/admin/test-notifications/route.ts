import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import notificationService from '@/app/lib/notifications';

// Mock booking data for testing
const mockBookingData = {
  id: 'test-booking-123',
  customer: {
    name: 'John Doe',
    email: 'test@example.com',
    phone: '+1-555-0123'
  },
  vehicle: {
    make: 'Lamborghini',
    model: 'Huracán',
    year: 2024,
    color: 'Arancio Borealis'
  },
  rental: {
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    duration: 2,
    pickupTime: '10:00 AM',
    dropoffTime: '10:00 AM'
  },
  pricing: {
    dailyRate: 899,
    totalAmount: 1798,
    depositAmount: 500,
    taxes: 143.84,
    fees: 50
  },
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockPaymentData = {
  id: 'test-payment-123',
  customerEmail: 'test@example.com',
  customerName: 'John Doe',
  amount: 500,
  currency: 'usd',
  status: 'succeeded',
  bookingId: 'test-booking-123',
  vehicle: mockBookingData.vehicle,
  rental: mockBookingData.rental
};

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailType, testEmail } = await request.json();

    if (!emailType) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 });
    }

    // Use test email if provided, otherwise use mock data
    const targetEmail = testEmail || mockBookingData.customer.email;
    let result = false;
    let emailDescription = '';

    switch (emailType) {
      case 'booking-request-admin':
        result = await notificationService.sendBookingNotification(mockBookingData);
        emailDescription = 'Admin booking request notification';
        break;

      case 'booking-request-customer':
        result = await notificationService.sendCustomerBookingConfirmation({
          ...mockBookingData,
          customer: { ...mockBookingData.customer, email: targetEmail }
        });
        emailDescription = 'Customer booking request confirmation';
        break;

      case 'booking-confirmed-customer':
        result = await notificationService.sendCustomerBookingConfirmed({
          ...mockBookingData,
          customer: { ...mockBookingData.customer, email: targetEmail },
          status: 'confirmed'
        });
        emailDescription = 'Customer booking confirmed notification';
        break;

      case 'payment-success-customer':
        result = await notificationService.sendCustomerPaymentReceipt({
          ...mockPaymentData,
          customerEmail: targetEmail
        });
        emailDescription = 'Customer payment success receipt';
        break;

      case 'payment-failed-customer':
        result = await notificationService.sendCustomerPaymentFailed({
          ...mockPaymentData,
          customerEmail: targetEmail,
          status: 'failed'
        });
        emailDescription = 'Customer payment failed notification';
        break;

      case 'payment-success-admin':
        result = await notificationService.sendPaymentNotification({
          type: 'payment_success',
          booking: mockBookingData,
          payment: mockPaymentData
        });
        emailDescription = 'Admin payment success notification';
        break;

      case 'payment-failed-admin':
        result = await notificationService.sendPaymentNotification({
          type: 'payment_failed',
          booking: mockBookingData,
          payment: { ...mockPaymentData, status: 'failed' }
        });
        emailDescription = 'Admin payment failed notification';
        break;

      case 'customer-reminder':
        result = await notificationService.sendCustomerReminder({
          ...mockBookingData,
          customer: { ...mockBookingData.customer, email: targetEmail }
        });
        emailDescription = 'Customer pickup reminder';
        break;

      case 'system-alert':
        result = await notificationService.sendSystemAlert({
          title: 'Test System Alert',
          message: 'This is a test system alert to verify email delivery.',
          severity: 'info'
        });
        emailDescription = 'System alert notification';
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    return NextResponse.json({
      success: result,
      emailType,
      emailDescription,
      targetEmail: emailType.includes('admin') ? 'admin@dtexoticslv.com' : targetEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available test email types
    const emailTypes = [
      { id: 'booking-request-admin', name: 'Admin Booking Request', description: 'New booking notification to admin' },
      { id: 'booking-request-customer', name: 'Customer Booking Request', description: 'Booking confirmation to customer' },
      { id: 'booking-confirmed-customer', name: 'Customer Booking Confirmed', description: 'Booking confirmed by admin to customer' },
      { id: 'payment-success-customer', name: 'Customer Payment Success', description: 'Payment receipt to customer' },
      { id: 'payment-failed-customer', name: 'Customer Payment Failed', description: 'Payment failure notice to customer' },
      { id: 'payment-success-admin', name: 'Admin Payment Success', description: 'Payment success notification to admin' },
      { id: 'payment-failed-admin', name: 'Admin Payment Failed', description: 'Payment failure alert to admin' },
      { id: 'customer-reminder', name: 'Customer Reminder', description: 'Pickup reminder to customer' },
      { id: 'system-alert', name: 'System Alert', description: 'System alert to admin' }
    ];

    return NextResponse.json({
      emailTypes,
      mockData: {
        booking: mockBookingData,
        payment: mockPaymentData
      }
    });

  } catch (error) {
    console.error('Get test notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get test notification types' },
      { status: 500 }
    );
  }
}
