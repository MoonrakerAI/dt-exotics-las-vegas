import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/app/lib/auth';
import { kv } from '@vercel/kv';
import NotificationService from '@/app/lib/notifications';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await validateSession(token);
    return user !== null && user.role === 'admin';
  } catch {
    return false;
  }
}

// GET: Get notification settings
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get settings from KV store or use defaults
    const settings = await kv.get('notification_settings') || NotificationService.getSettings();
    
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT: Update notification settings
export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Validate settings structure
    const validKeys = ['emailNotifications', 'bookingAlerts', 'paymentAlerts', 'systemAlerts', 'adminEmail'];
    const filteredSettings = Object.keys(settings)
      .filter(key => validKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = settings[key];
        return obj;
      }, {} as any);

    // Validate email if provided
    if (filteredSettings.adminEmail && !isValidEmail(filteredSettings.adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid admin email address' },
        { status: 400 }
      );
    }

    // Update notification service
    NotificationService.updateSettings(filteredSettings);
    
    // Save to KV store
    await kv.set('notification_settings', NotificationService.getSettings());

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: NotificationService.getSettings()
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

// POST: Send test email
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { type } = body;

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'booking', 'payment_success', 'payment_failed', 'system',
      'customer_booking', 'customer_payment_success', 'customer_payment_failed', 'customer_reminder'
    ];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load current settings
    const savedSettings = await kv.get('notification_settings');
    if (savedSettings) {
      NotificationService.updateSettings(savedSettings as any);
    }

    // Send test email
    const success = await NotificationService.sendTestEmail(type);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} email sent successfully`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email. Check your Resend API key and configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
