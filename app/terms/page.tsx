import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'

export default function TermsOfService() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">TERMS OF</span>{' '}
              <span className="neon-text">SERVICE</span>
            </h1>
            <p className="text-lg text-gray-400">
              Effective Date: January 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using the services of DT Exotics Las Vegas ("DT EXOTICS LV," "we," "us," or "our"), 
                you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not 
                agree with any of these terms, you are prohibited from using our services.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">2. Vehicle Rental Services</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                DT EXOTICS LV provides luxury and exotic vehicle rental services in Las Vegas, Nevada. Our services include:
              </p>
              <ul className="text-gray-300 leading-relaxed list-disc list-inside space-y-2">
                <li>Luxury supercar rentals</li>
                <li>Exotic vehicle experiences</li>
                <li>VIP concierge services</li>
                <li>Delivery and pickup services</li>
              </ul>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">3. Rental Requirements</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Age Requirements</h3>
                  <p>Renters must be at least 21 years old for most vehicles and 25 years old for high-performance models.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Driver's License</h3>
                  <p>A valid driver's license is required and must be presented at the time of rental.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Insurance</h3>
                  <p>Proof of full coverage insurance that transfers to rental vehicles is mandatory.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Security Deposit</h3>
                  <p>A refundable security deposit is required for all rentals. The amount varies by vehicle.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">4. Rental Terms and Conditions</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Mileage Limits</h3>
                  <p>Each rental includes a set mileage limit. Additional miles may be purchased at prevailing rates.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Fuel Policy</h3>
                  <p>Vehicles must be returned with a full tank of fuel. Refueling charges apply if not returned full.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Geographic Restrictions</h3>
                  <p>Travel outside Las Vegas may be restricted. Please discuss travel plans with us in advance.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">5. Liability and Damages</h2>
              <p className="text-gray-300 leading-relaxed">
                Renters are responsible for any damage to the vehicle beyond normal wear and tear. This includes 
                but is not limited to: accidents, theft, vandalism, traffic violations, tolls, and parking tickets. 
                All incidents must be reported immediately to DT EXOTICS LV and local authorities when applicable.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">6. Cancellation Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                Cancellations made within certain timeframes may be eligible for refunds or credits. Please contact 
                us for specific details regarding our cancellation terms. Refund eligibility depends on the timing 
                of cancellation and specific circumstances.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                DT EXOTICS LV's liability is limited to the maximum extent permitted by law. We are not liable for 
                indirect, incidental, special, or consequential damages arising from the use of our services or vehicles.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">8. Modifications to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                DT EXOTICS LV reserves the right to modify these terms at any time. Changes will be effective 
                immediately upon posting on our website. Continued use of our services constitutes acceptance of modified terms.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">9. Contact Information</h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-2">For questions regarding these Terms of Service, please contact us:</p>
                <div className="space-y-2">
                  <p><span className="text-neon-blue font-tech">Phone:</span> (702) 518-0924</p>
                  <p><span className="text-neon-blue font-tech">Email:</span> contact@dtexoticslv.com</p>
                  <p><span className="text-neon-blue font-tech">Location:</span> Las Vegas, Nevada</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <a 
                href="/" 
                className="btn-primary inline-block"
              >
                BACK TO HOME
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}