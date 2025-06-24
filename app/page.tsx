import Navbar from './components/navigation/Navbar'
import HeroSection from './components/sections/HeroSection'
import ExperienceSection from './components/sections/ExperienceSection'
import ProcessSection from './components/sections/ProcessSection'
import CarSelector from './components/sections/CarSelector'
import VIPServicesSection from './components/sections/VIPServicesSection'
import EmbeddedChat from './components/ui/EmbeddedChat'
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
      <section className="py-20 px-4 relative" id="contact">
        <div className="max-w-[1200px] mx-auto">
          <EmbeddedChat />
        </div>
      </section>
      <FAQSection />
      <Footer />
    </main>
  )
}