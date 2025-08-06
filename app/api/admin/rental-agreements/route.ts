import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { SimpleAuth } from '@/app/lib/simple-auth';
import { RentalAgreement, CreateRentalAgreementRequest } from '@/app/types/rental-agreement';
import { RentalBooking } from '@/app/types/rental';
import { NotificationService } from '@/app/lib/notifications';

// GET /api/admin/rental-agreements - Get all rental agreements or specific one
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = SimpleAuth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = SimpleAuth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: CreateRentalAgreementRequest = await request.json();
    const { bookingId, expirationDays = 7, customMessage } = body;

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
    
    const activeAgreement = existingAgreements.find(agreement => 
      agreement && (agreement.status === 'pending' || agreement.status === 'completed')
    );

    if (activeAgreement) {
      return NextResponse.json({ 
        error: 'Active rental agreement already exists for this booking',
        existingAgreement: activeAgreement
      }, { status: 409 });
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
      sentBy: user.email,
      emailSent: false,
      remindersSent: 0,
      createdAt: now,
      updatedAt: now
    };

    // Save agreement to database
    await kv.set(`rental_agreement:${agreementId}`, agreement);
    await kv.sadd(`booking_agreements:${bookingId}`, agreementId);
    await kv.sadd('all_rental_agreements', agreementId);

    // Send email to customer
    try {
      const agreementUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/rental-agreement/${agreementId}`;
      
      await NotificationService.sendRentalAgreementEmail({
        customerEmail: booking.customer.email,
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
      });

      // Update agreement as email sent
      agreement.emailSent = true;
      agreement.updatedAt = new Date().toISOString();
      await kv.set(`rental_agreement:${agreementId}`, agreement);

    } catch (emailError) {
      console.error('Failed to send rental agreement email:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      agreement,
      agreementUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/rental-agreement/${agreementId}`
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = SimpleAuth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { agreementId, action, ...updates } = body;

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
        const agreementUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/rental-agreement/${agreementId}`;
        
        await NotificationService.sendRentalAgreementEmail({
          customerEmail: booking.customer.email,
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
        });

        // Update reminder count
        agreement.remindersSent += 1;
        agreement.lastReminderAt = new Date().toISOString();
        agreement.updatedAt = new Date().toISOString();
        
        await kv.set(`rental_agreement:${agreementId}`, agreement);

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
