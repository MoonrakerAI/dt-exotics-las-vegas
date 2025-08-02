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
          <ContactInfoBoxes />
          
          {/* Google Maps Embed */}
          <div className="mt-16 mb-16">
            <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-600/30">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d34860.575371039995!2d-115.20721482089843!3d36.015201100000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c8cffa30913ab1%3A0x6b5282366b48d73!2sDT%20Exotics%20Supercar%20Rentals!5e1!3m2!1sen!2ssg!4v1754127505545!5m2!1sen!2ssg"
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="DT Exotics Supercar Rentals Location"
              />
            </div>
          </div>
        </div>
      </section>
      <FAQSection />
      <Footer />
    </main>
  )
}