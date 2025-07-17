import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'

export default function PrivacyPolicy() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">PRIVACY</span>{' '}
              <span className="neon-text">POLICY</span>
            </h1>
            <p className="text-lg text-gray-400">
              Effective Date: January 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">1. Information We Collect</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Personal Information</h3>
                  <p>When you book a rental with DT EXOTICS LV, we collect:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Full name and contact information</li>
                    <li>Driver's license details</li>
                    <li>Insurance information</li>
                    <li>Payment and billing information</li>
                    <li>Emergency contact details</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Website Usage Data</h3>
                  <p>We automatically collect certain information when you visit our website:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>IP address and location data</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent</li>
                    <li>Referring website information</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">2. How We Use Your Information</h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-4">DT EXOTICS LV uses your information to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Process and manage your vehicle rental reservations</li>
                  <li>Verify your identity and eligibility to rent</li>
                  <li>Communicate with you about your rental and our services</li>
                  <li>Process payments and manage billing</li>
                  <li>Provide customer support and assistance</li>
                  <li>Improve our website and services</li>
                  <li>Send promotional offers and updates (with your consent)</li>
                  <li>Comply with legal requirements and protect our business</li>
                </ul>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">3. Information Sharing</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Service Providers</h3>
                  <p>We may share information with trusted third-party service providers who assist us in operating our business, including payment processors, insurance companies, and maintenance providers.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Legal Requirements</h3>
                  <p>We may disclose information when required by law, court order, or to protect our rights and safety.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Business Transfers</h3>
                  <p>In the event of a merger, acquisition, or sale of assets, customer information may be transferred as part of the transaction.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">4. Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, 
                secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, 
                and we cannot guarantee absolute security.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">5. Cookies and Tracking</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>Our website uses cookies and similar tracking technologies to enhance your browsing experience:</p>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Essential Cookies</h3>
                  <p>Required for basic website functionality, such as maintaining your session and processing bookings.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Analytics Cookies</h3>
                  <p>Help us understand how visitors use our website to improve performance and user experience.</p>
                </div>
                <div>
                  <h3 className="text-lg font-tech font-semibold text-neon-blue mb-2">Marketing Cookies</h3>
                  <p>Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">6. Your Rights</h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-4">You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><span className="text-neon-blue font-tech">Access:</span> Request a copy of the personal information we hold about you</li>
                  <li><span className="text-neon-blue font-tech">Correction:</span> Request correction of inaccurate or incomplete information</li>
                  <li><span className="text-neon-blue font-tech">Deletion:</span> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><span className="text-neon-blue font-tech">Opt-out:</span> Unsubscribe from marketing communications at any time</li>
                  <li><span className="text-neon-blue font-tech">Portability:</span> Request a copy of your data in a structured, machine-readable format</li>
                </ul>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">7. Data Retention</h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, 
                unless a longer retention period is required by law. Rental records and related information are typically 
                retained for seven years for tax and legal compliance purposes.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">8. Third-Party Links</h2>
              <p className="text-gray-300 leading-relaxed">
                Our website may contain links to third-party websites. This privacy policy does not apply to those sites, 
                and we are not responsible for their privacy practices. We encourage you to read the privacy policies of 
                any third-party websites you visit.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                DT EXOTICS LV may update this privacy policy from time to time. We will notify you of significant changes 
                by posting the updated policy on our website with a new effective date. Your continued use of our services 
                after changes are posted constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30">
              <h2 className="text-2xl font-tech font-bold text-white mb-4">10. Contact Us</h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-4">If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
                <div className="space-y-2">
                  <p><span className="text-neon-blue font-tech">Phone:</span> (702) 518-0924</p>
                  <p><span className="text-neon-blue font-tech">Email:</span> contact@dtexoticslv.com</p>
                  <p><span className="text-neon-blue font-tech">Location:</span> Las Vegas, Nevada</p>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  We will respond to your inquiry within 30 days of receipt.
                </p>
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