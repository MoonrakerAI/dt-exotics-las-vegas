'use client'

export default function ExperienceSection() {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-[1400px] mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-tech font-black mb-8">
          <div className="flex flex-col items-center">
            <span className="text-white">READY TO TURN HEADS IN</span>
            <span className="neon-text-magenta">SIN CITY?</span>
          </div>
        </h2>
        
        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            At DT EXOTICS LV, we don't just rent cars—we deliver unforgettable experiences. Imagine 
            cruising the Strip, commanding attention, and owning every moment behind the wheel of 
            a high-performance masterpiece. Whether it's the spine-tingling roar of a Lamborghini 
            Huracán, the sleek sophistication of an Audi R8 Black Panther Edition, or the raw power of 
            a Dodge Hellcat, we've got the perfect ride to match your style.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            Why wait to live the dream? Shoot us a text and let's make your Vegas experience 
            legendary. The keys are closer than you think—just reach out, and we'll take care of the 
            rest.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="sms:+17027208948" 
            className="btn-primary inline-block"
          >
            TEXT US NOW
          </a>
          <a href="#contact" className="btn-secondary inline-block">
            BOOK ONLINE
          </a>
        </div>
      </div>
    </section>
  )
}