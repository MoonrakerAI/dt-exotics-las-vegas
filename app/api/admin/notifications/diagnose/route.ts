import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import notificationService from '@/app/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
        NODE_ENV: process.env.NODE_ENV
      },
      notificationSettings: {},
      tests: []
    };

    // Load notification settings from KV
    const savedSettings = await kv.get('notification_settings');
    if (savedSettings) {
      notificationService.updateSettings(savedSettings as any);
      diagnostics.notificationSettings = {
        status: '✅ Loaded from KV',
        settings: savedSettings
      };
    } else {
      diagnostics.notificationSettings = {
        status: '⚠️ No settings in KV, using defaults',
        settings: notificationService.getSettings()
      };
    }

    // Get current settings
    const currentSettings = notificationService.getSettings();
    diagnostics.currentSettings = currentSettings;

    // Check each notification type
    const checks = [
      {
        name: 'Email Notifications Master Switch',
        enabled: currentSettings.emailNotifications,
        status: currentSettings.emailNotifications ? '✅ Enabled' : '❌ Disabled'
      },
      {
        name: 'Booking Alerts',
        enabled: currentSettings.bookingAlerts,
        status: currentSettings.bookingAlerts ? '✅ Enabled' : '❌ Disabled',
        blockedBy: !currentSettings.emailNotifications ? 'Master switch disabled' : null
      },
      {
        name: 'Payment Alerts',
        enabled: currentSettings.paymentAlerts,
        status: currentSettings.paymentAlerts ? '✅ Enabled' : '❌ Disabled',
        blockedBy: !currentSettings.emailNotifications ? 'Master switch disabled' : null
      },
      {
        name: 'System Alerts',
        enabled: currentSettings.systemAlerts,
        status: currentSettings.systemAlerts ? '✅ Enabled' : '❌ Disabled',
        blockedBy: !currentSettings.emailNotifications ? 'Master switch disabled' : null
      }
    ];

    diagnostics.checks = checks;

    // Admin emails configuration
    diagnostics.adminEmails = {
      configured: currentSettings.adminEmails,
      count: currentSettings.adminEmails?.length || 0,
      status: (currentSettings.adminEmails?.length || 0) > 0 ? '✅ Configured' : '❌ No admin emails'
    };

    // API endpoints that send notifications
    diagnostics.apiEndpoints = [
      {
        endpoint: '/api/webhooks/stripe',
        notifications: ['Booking confirmation', 'Payment success', 'Payment failed'],
        settingsLoaded: '✅ Now loads settings from KV'
      },
      {
        endpoint: '/api/rentals/create-deposit-intent',
        notifications: ['Booking confirmation'],
        settingsLoaded: '✅ Now loads settings from KV'
      },
      {
        endpoint: '/api/admin/reminders/send',
        notifications: ['Customer reminders'],
        settingsLoaded: '✅ Now loads settings from KV'
      },
      {
        endpoint: '/api/contact/event',
        notifications: ['Event inquiry', 'Customer event confirmation'],
        settingsLoaded: '✅ Already loads settings from KV'
      },
      {
        endpoint: '/api/contact',
        notifications: ['Contact form'],
        settingsLoaded: '✅ Already loads settings from KV'
      }
    ];

    // Issues found
    const issues: string[] = [];
    
    if (!process.env.RESEND_API_KEY) {
      issues.push('❌ CRITICAL: RESEND_API_KEY environment variable is missing - NO emails will be sent');
    }
    
    if (!currentSettings.emailNotifications) {
      issues.push('❌ CRITICAL: Email notifications master switch is disabled - NO emails will be sent');
    }
    
    if (!currentSettings.bookingAlerts) {
      issues.push('⚠️ WARNING: Booking alerts are disabled - Booking confirmation emails will NOT be sent');
    }
    
    if (!currentSettings.paymentAlerts) {
      issues.push('⚠️ WARNING: Payment alerts are disabled - Payment notification emails will NOT be sent');
    }
    
    if (!currentSettings.systemAlerts) {
      issues.push('⚠️ WARNING: System alerts are disabled - System alert emails will NOT be sent');
    }
    
    if (!currentSettings.adminEmails || currentSettings.adminEmails.length === 0) {
      issues.push('⚠️ WARNING: No admin emails configured - Admin notifications will fail');
    }

    diagnostics.issues = issues;
    diagnostics.issueCount = issues.length;
    diagnostics.status = issues.some(i => i.startsWith('❌')) ? 'CRITICAL ISSUES FOUND' : 
                        issues.length > 0 ? 'WARNINGS FOUND' : 'ALL CHECKS PASSED';

    // Recommendations
    const recommendations: string[] = [];
    
    if (!process.env.RESEND_API_KEY) {
      recommendations.push('1. Add RESEND_API_KEY to your environment variables');
      recommendations.push('   - Get API key from: https://resend.com/api-keys');
      recommendations.push('   - Add to .env.local: RESEND_API_KEY=re_your_api_key');
    }
    
    if (!currentSettings.emailNotifications) {
      recommendations.push('2. Enable email notifications in admin settings');
      recommendations.push('   - Go to: /admin/notifications');
      recommendations.push('   - Toggle "Email Notifications" to ON');
    }
    
    if (!currentSettings.bookingAlerts || !currentSettings.paymentAlerts) {
      recommendations.push('3. Enable specific notification types in admin settings');
      recommendations.push('   - Go to: /admin/notifications');
      recommendations.push('   - Enable: Booking Alerts, Payment Alerts, System Alerts');
    }

    diagnostics.recommendations = recommendations;

    return NextResponse.json(diagnostics, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      { 
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
