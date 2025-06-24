import Navbar from './components/navigation/Navbar'
import HeroSection from './components/sections/HeroSection'
import ExperienceSection from './components/sections/ExperienceSection'
import ProcessSection from './components/sections/ProcessSection'
import CarSelector from './components/sections/CarSelector'
import VIPServicesSection from './components/sections/VIPServicesSection'
import ContactForm from './components/sections/ContactForm'
import FAQSection from './components/sections/FAQSection'
import Footer from './components/sections/Footer'

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <ExperienceSection />
      <CarSelector />
      <ProcessSection />
      <VIPServicesSection />
      <ContactForm />
      <FAQSection />
      <Footer />
    </main>
  )
}