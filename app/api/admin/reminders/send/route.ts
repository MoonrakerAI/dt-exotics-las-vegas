import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import kvRentalDB from '@/app/lib/kv-database';
import carDB from '@/app/lib/car-database';
import notificationService from '@/app/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Get current date and tomorrow's date for reminder window
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Format dates for comparison (YYYY-MM-DD)
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    console.log(`Checking for reminders to send for dates: ${tomorrowStr} and ${dayAfterTomorrowStr}`);

    // Get all confirmed rentals
    const allRentals = await kvRentalDB.getAllRentals();
    const confirmedRentals = allRentals.filter(rental => 
      rental.status === 'confirmed' || rental.status === 'active'
    );

    let remindersSent = 0;
    const errors: string[] = [];

    for (const rental of confirmedRentals) {
      try {
        const startDate = rental.rentalDates.startDate;
        
        // Send reminder if rental starts tomorrow or day after tomorrow
        if (startDate === tomorrowStr || startDate === dayAfterTomorrowStr) {
          // Get car details
          const car = await carDB.getCar(rental.carId);
          if (!car) {
            console.error(`Car not found for rental ${rental.id}`);
            errors.push(`Car not found for rental ${rental.id}`);
            continue;
          }

          // Check if reminder was already sent (to avoid duplicates)
          const reminderKey = `reminder_sent:${rental.id}:${startDate}`;
          const reminderAlreadySent = await kv.get(reminderKey);
          
          if (reminderAlreadySent) {
            console.log(`Reminder already sent for rental ${rental.id} on ${startDate}`);
            continue;
          }

          // Prepare booking data for reminder
          const bookingData = {
            id: rental.id,
            customer: rental.customer,
            car: {
              id: car.id,
              brand: car.brand,
              model: car.model,
              year: car.year,
              dailyPrice: car.price.daily
            },
            rentalDates: rental.rentalDates,
            pricing: rental.pricing,
            status: rental.status
          };

          // Send reminder
          console.log(`Sending reminder for rental ${rental.id} to ${rental.customer.email}`);
          const reminderSent = await notificationService.sendCustomerReminder(bookingData);

          if (reminderSent) {
            // Mark reminder as sent (expires in 7 days to prevent permanent storage)
            await kv.set(reminderKey, true, { ex: 604800 }); // Expire in 7 days
            remindersSent++;
            console.log(`Reminder sent successfully for rental ${rental.id}`);
          } else {
            errors.push(`Failed to send reminder for rental ${rental.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing rental ${rental.id}:`, error);
        errors.push(`Error processing rental ${rental.id}: ${error}`);
      }
    }

    console.log(`Reminder job completed. Sent: ${remindersSent}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully sent ${remindersSent} reminders${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Error in reminder scheduler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  // Allow manual trigger for testing
  return POST(request);
}
