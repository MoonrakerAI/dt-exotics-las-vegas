import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyJWT } from '@/app/lib/auth';
import { RentalAgreement, CreateRentalAgreementRequest } from '@/app/types/rental-agreement';
import { RentalBooking } from '@/app/types/rental';
import { NotificationService } from '@/app/lib/notifications';

// Helper function to verify admin authentication
async function isAdminAuthenticated(request: NextRequest): Promise<{user: any} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await verifyJWT(token);
    return user && user.role === 'admin' ? {user} : null;
  } catch {
    return null;
  }
}

// GET /api/admin/rental-agreements - Get all rental agreements or specific one
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await isAdminAuthenticated(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agreementId = searchParams.get('id');
    const bookingId = searchParams.get('bookingId');

    if (agreementId) {
      // Get specific agreement
      const agreement = await kv.get<RentalAgreement>(`rental_agreement:${agreementId}`);
      if (!agreement) {
        return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
      }
      return NextResponse.json({ agreement });
    }

    if (bookingId) {
      // Get agreements for specific booking
      const agreementIds = await kv.smembers(`booking_agreements:${bookingId}`);
      const agreements = await Promise.all(
        agreementIds.map(id => kv.get<RentalAgreement>(`rental_agreement:${id}`))
      );
      return NextResponse.json({ agreements: agreements.filter(Boolean) });
    }

    // Get all agreements
    const allAgreementIds = await kv.smembers('all_rental_agreements');
    const agreements = await Promise.all(
      allAgreementIds.map(id => kv.get<RentalAgreement>(`rental_agreement:${id}`))
    );

    return NextResponse.json({ 
      agreements: agreements.filter(Boolean).sort((a, b) => 
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )
    });

  } catch (error) {
    console.error('Error fetching rental agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreements' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rental-agreements - Create and send new rental agreement
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await isAdminAuthenticated(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRentalAgreementRequest = await request.json();
    const { bookingId, expirationDays = 7, customMessage, recipientEmails } = body;

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get the booking details
    const booking = await kv.get<RentalBooking>(`rental:${bookingId}`);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if agreement already exists for this booking
    const existingAgreementIds = await kv.smembers(`booking_agreements:${bookingId}`);
    const existingAgreements = await Promise.all(
      existingAgreementIds.map(id => kv.get<RentalAgreement>(`rental_agreement:${id}`))
    );
    
    // Allow multiple agreements - customers may lose them and need resends
    // We'll mark previous agreements as 'superseded' when creating a new one
    const activeAgreements = existingAgreements.filter(agreement => 
      agreement && (agreement.status === 'pending' || agreement.status === 'completed')
    );

    // Mark existing active agreements as superseded
    if (activeAgreements.length > 0) {
      await Promise.all(
        activeAgreements.map(async (agreement) => {
          if (agreement) {
            agreement.status = 'superseded';
            agreement.updatedAt = new Date().toISOString();
            await kv.set(`rental_agreement:${agreement.id}`, agreement);
          }
        })
      );
    }

    // Generate unique agreement ID
    const agreementId = `agreement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)).toISOString();

    // Create rental agreement
    const agreement: RentalAgreement = {
      id: agreementId,
      bookingId,
      status: 'pending',
      agreementData: {
        // Pre-fill from booking data
        fullName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        dateOfBirth: '',
        driversLicenseNumber: booking.customer.driversLicense,
        driversLicenseState: '',
        driversLicenseExpiry: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        vehicleInfo: {
          brand: booking.car.brand,
          model: booking.car.model,
          year: booking.car.year,
          licensePlate: '',
          vin: ''
        },
        rentalPeriod: {
          startDate: booking.rentalDates.startDate,
          endDate: booking.rentalDates.endDate,
          pickupTime: '10:00 AM',
          returnTime: '10:00 AM'
        },
        pricing: {
          dailyRate: booking.pricing.dailyRate,
          totalDays: booking.pricing.totalDays,
          subtotal: booking.pricing.subtotal,
          securityDeposit: booking.pricing.depositAmount,
          totalAmount: booking.pricing.finalAmount
        },
        termsAccepted: {
          ageRequirement: false,
          validLicense: false,
          insurance: false,
          noViolations: false,
          vehicleCondition: false,
          returnCondition: false,
          fuelPolicy: false,
          smokingPolicy: false,
          geographicLimits: false,
          modifications: false,
          liability: false,
          lateReturn: false
        },
        signature: {
          dataUrl: '',
          timestamp: '',
          ipAddress: ''
        },
        specialInstructions: '',
        adminNotes: customMessage || ''
      },
      sentAt: now,
      expiresAt,
      sentBy: authResult.user.email || 'admin',
      emailSent: false,
      remindersSent: 0,
      createdAt: now,
      updatedAt: now
    };

    // Save agreement to database
    await kv.set(`rental_agreement:${agreementId}`, agreement);
    await kv.sadd(`booking_agreements:${bookingId}`, agreementId);
    await kv.sadd('all_rental_agreements', agreementId);

    // Define base URL for use throughout function
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://dtexoticslv.com';

    // Send email to customer
    try {
      const agreementUrl = `${baseUrl}/rental-agreement/${agreementId}`;

      const recipients = Array.isArray(recipientEmails) && recipientEmails.length > 0
        ? recipientEmails
        : [booking.customer.email];

      const results = await Promise.allSettled(
        recipients.map(email => 
          NotificationService.getInstance().sendRentalAgreementEmail({
            customerEmail: email,
            customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
            bookingId: booking.id,
            agreementUrl,
            expiresAt: expiresAt,
            vehicleInfo: `${booking.car.year} ${booking.car.brand} ${booking.car.model}`,
            rentalDates: {
              startDate: booking.rentalDates.startDate,
              endDate: booking.rentalDates.endDate
            },
            customMessage
          })
        )
      );

      const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
      if (anySuccess) {
        agreement.emailSent = true;
        agreement.updatedAt = new Date().toISOString();
        await kv.set(`rental_agreement:${agreementId}`, agreement);
      }

    } catch (emailError) {
      console.error('Failed to send rental agreement email:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      agreement,
      agreementUrl: `${baseUrl}/rental-agreement/${agreementId}`
    });

  } catch (error) {
    console.error('Error creating rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create rental agreement' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rental-agreements - Update agreement status or resend
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await isAdminAuthenticated(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agreementId, action, recipientEmails, ...updates } = body;

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
    }

    // Get existing agreement
    const agreement = await kv.get<RentalAgreement>(`rental_agreement:${agreementId}`);
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    if (action === 'resend') {
      // Resend agreement email
      const booking = await kv.get<RentalBooking>(`rental:${agreement.bookingId}`);
      if (!booking) {
        return NextResponse.json({ error: 'Associated booking not found' }, { status: 404 });
      }

      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://dtexoticslv.com';
        const agreementUrl = `${baseUrl}/rental-agreement/${agreementId}`;
        const recipients = Array.isArray(recipientEmails) && recipientEmails.length > 0
          ? recipientEmails
          : [booking.customer.email];

        const results = await Promise.allSettled(
          recipients.map(email => 
            NotificationService.getInstance().sendRentalAgreementEmail({
              customerEmail: email,
              customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
              bookingId: booking.id,
              agreementUrl,
              expiresAt: agreement.expiresAt,
              vehicleInfo: `${booking.car.year} ${booking.car.brand} ${booking.car.model}`,
              rentalDates: {
                startDate: booking.rentalDates.startDate,
                endDate: booking.rentalDates.endDate
              },
              isReminder: true
            })
          )
        );

        const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
        if (anySuccess) {
          // Update reminder count
          agreement.remindersSent += 1;
          agreement.lastReminderAt = new Date().toISOString();
          agreement.updatedAt = new Date().toISOString();
          await kv.set(`rental_agreement:${agreementId}`, agreement);
        }

        return NextResponse.json({ success: true, agreement });

      } catch (emailError) {
        console.error('Failed to resend rental agreement email:', emailError);
        return NextResponse.json({ error: 'Failed to resend email' }, { status: 500 });
      }
    }

    // Update agreement with provided fields
    const updatedAgreement = {
      ...agreement,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`rental_agreement:${agreementId}`, updatedAgreement);

    return NextResponse.json({ success: true, agreement: updatedAgreement });

  } catch (error) {
    console.error('Error updating rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update rental agreement' },
      { status: 500 }
    );
  }
}
