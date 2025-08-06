import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { RentalAgreement, RentalAgreementFormData } from '@/app/types/rental-agreement';
import { RentalBooking } from '@/app/types/rental';
import { NotificationService } from '@/app/lib/notifications';

// GET /api/rental-agreement/[id] - Get rental agreement for client completion
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const agreementId = params.id;

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
    }

    // Get the rental agreement
    const agreement = await kv.get<RentalAgreement>(`rental_agreement:${agreementId}`);
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if agreement has expired
    const now = new Date();
    const expiresAt = new Date(agreement.expiresAt);
    if (now > expiresAt && agreement.status === 'pending') {
      // Mark as expired
      agreement.status = 'expired';
      agreement.updatedAt = new Date().toISOString();
      await kv.set(`rental_agreement:${agreementId}`, agreement);
      
      return NextResponse.json({ error: 'Agreement has expired' }, { status: 410 });
    }

    // Get associated booking for additional context
    const booking = await kv.get<RentalBooking>(`rental:${agreement.bookingId}`);
    if (!booking) {
      return NextResponse.json({ error: 'Associated booking not found' }, { status: 404 });
    }

    // Track email opened (first time only)
    if (!agreement.emailOpenedAt) {
      agreement.emailOpenedAt = new Date().toISOString();
      agreement.updatedAt = new Date().toISOString();
      await kv.set(`rental_agreement:${agreementId}`, agreement);
    }

    // Return agreement data (excluding sensitive admin fields)
    const clientAgreement = {
      id: agreement.id,
      bookingId: agreement.bookingId,
      status: agreement.status,
      agreementData: agreement.agreementData,
      expiresAt: agreement.expiresAt,
      booking: {
        id: booking.id,
        customer: booking.customer,
        car: booking.car,
        rentalDates: booking.rentalDates,
        pricing: booking.pricing
      }
    };

    return NextResponse.json({ agreement: clientAgreement });

  } catch (error) {
    console.error('Error fetching rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreement' },
      { status: 500 }
    );
  }
}

// POST /api/rental-agreement/[id] - Submit completed rental agreement
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const agreementId = params.id;
    const clientIpAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
    }

    // Get the rental agreement
    const agreement = await kv.get<RentalAgreement>(`rental_agreement:${agreementId}`);
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if agreement has expired
    const now = new Date();
    const expiresAt = new Date(agreement.expiresAt);
    if (now > expiresAt && agreement.status === 'pending') {
      return NextResponse.json({ error: 'Agreement has expired' }, { status: 410 });
    }

    // Check if already completed
    if (agreement.status === 'completed') {
      return NextResponse.json({ error: 'Agreement already completed' }, { status: 409 });
    }

    // Parse form data
    const formData: RentalAgreementFormData = await request.json();

    // Validate required fields
    const requiredFields = [
      'fullName', 'dateOfBirth', 'driversLicenseNumber', 'driversLicenseState', 
      'driversLicenseExpiry', 'street', 'city', 'state', 'zipCode',
      'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone',
      'pickupTime', 'returnTime', 'signature'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof RentalAgreementFormData]);
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields 
      }, { status: 400 });
    }

    // Validate all terms are accepted
    const termsFields = [
      'ageRequirement', 'validLicense', 'insurance', 'noViolations',
      'vehicleCondition', 'returnCondition', 'fuelPolicy', 'smokingPolicy',
      'geographicLimits', 'modifications', 'liability', 'lateReturn'
    ];

    const unacceptedTerms = termsFields.filter(field => !formData[field as keyof RentalAgreementFormData]);
    if (unacceptedTerms.length > 0) {
      return NextResponse.json({ 
        error: 'All terms must be accepted', 
        unacceptedTerms 
      }, { status: 400 });
    }

    // Validate signature
    if (!formData.signature || !formData.signature.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Valid signature is required' }, { status: 400 });
    }

    // Update agreement with completed data
    const completedAgreement: RentalAgreement = {
      ...agreement,
      status: 'completed',
      agreementData: {
        ...agreement.agreementData,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        driversLicenseNumber: formData.driversLicenseNumber,
        driversLicenseState: formData.driversLicenseState,
        driversLicenseExpiry: formData.driversLicenseExpiry,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone
        },
        rentalPeriod: {
          ...agreement.agreementData.rentalPeriod,
          pickupTime: formData.pickupTime,
          returnTime: formData.returnTime
        },
        termsAccepted: {
          ageRequirement: formData.ageRequirement,
          validLicense: formData.validLicense,
          insurance: formData.insurance,
          noViolations: formData.noViolations,
          vehicleCondition: formData.vehicleCondition,
          returnCondition: formData.returnCondition,
          fuelPolicy: formData.fuelPolicy,
          smokingPolicy: formData.smokingPolicy,
          geographicLimits: formData.geographicLimits,
          modifications: formData.modifications,
          liability: formData.liability,
          lateReturn: formData.lateReturn
        },
        signature: {
          dataUrl: formData.signature,
          timestamp: new Date().toISOString(),
          ipAddress: clientIpAddress
        },
        specialInstructions: formData.specialInstructions || ''
      },
      completedAt: new Date().toISOString(),
      clientIpAddress,
      updatedAt: new Date().toISOString()
    };

    // Save completed agreement
    await kv.set(`rental_agreement:${agreementId}`, completedAgreement);

    // Get booking for notification
    const booking = await kv.get<RentalBooking>(`rental:${agreement.bookingId}`);
    if (booking) {
      // Send notification to admin about completed agreement
      try {
        await NotificationService.sendRentalAgreementCompletedNotification({
          bookingId: booking.id,
          agreementId: agreementId,
          customerName: formData.fullName,
          vehicleInfo: `${booking.car.year} ${booking.car.brand} ${booking.car.model}`,
          rentalDates: {
            startDate: booking.rentalDates.startDate,
            endDate: booking.rentalDates.endDate
          },
          completedAt: completedAgreement.completedAt!
        });
      } catch (emailError) {
        console.error('Failed to send completion notification:', emailError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rental agreement completed successfully',
      agreementId: agreementId
    });

  } catch (error) {
    console.error('Error submitting rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to submit rental agreement' },
      { status: 500 }
    );
  }
}
