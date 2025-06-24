export default function ContactInfoBoxes() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-12">
      <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
          <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <p className="font-tech text-sm mb-1 text-white">CALL US</p>
        <p className="text-gray-400">(702) 720-8948</p>
      </div>
      <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
          <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-tech text-sm mb-1 text-white">EMAIL US</p>
        <p className="text-gray-400">contact@dtexoticslv.com</p>
      </div>
      <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
          <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="font-tech text-sm mb-1 text-white">VISIT US</p>
        <p className="text-gray-400">Las Vegas, NV</p>
      </div>
    </div>
  )
}