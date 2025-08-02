import Navbar from './components/navigation/Navbar'
import HeroSection from './components/sections/HeroSection'
import ExperienceSection from './components/sections/ExperienceSection'
import ProcessSection from './components/sections/ProcessSection'
import CarSelector from './components/sections/CarSelector'
import VIPServicesSection from './components/sections/VIPServicesSection'
import EmbeddedChat from './components/ui/EmbeddedChat'
import ContactInfoBoxes from './components/sections/ContactInfoBoxes'
import FAQSection from './components/sections/FAQSection'
import Footer from './components/sections/Footer'
import PreventAutoScroll from './components/ui/PreventAutoScroll'

export default function Home() {
  return (
    <main className="relative">
      <PreventAutoScroll />
      <Navbar />
      <HeroSection />
      <ExperienceSection />
      <CarSelector />
      <ProcessSection />
      <VIPServicesSection />
      <section className="py-20 px-4 relative" id="contact">
        <div className="max-w-[1200px] mx-auto">
          <EmbeddedChat />
          
          {/* Address Section */}
          <div className="text-center mt-8 mb-12">
            <p className="text-lg text-gray-300 font-medium">
              📍 9620 Las Vegas Blvd S STE E4 508, Las Vegas, NV 89123
            </p>
          </div>
          
          {/* Google Maps Embed */}
          <div className="mb-12">
            <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-600/30">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3220.8!2d-115.1723!3d36.0988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c8c4a962d22c45%3A0xb4c5d6e7f8a9b0c1!2sDT%20Exotics%20Las%20Vegas%2C%209620%20Las%20Vegas%20Blvd%20S%20STE%20E4%20508%2C%20Las%20Vegas%2C%20NV%2089123!5e0!3m2!1sen!2sus!4v1640995200000!5m2!1sen!2sus"
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="DT Exotics Las Vegas Location"
              />
            </div>
          </div>
          
          <ContactInfoBoxes />
        </div>
      </section>
      <FAQSection />
      <Footer />
    </main>
  )
}