'use client'

import { useState, useEffect } from 'react'
import { cars } from '../../data/cars'
import { SimpleAuth } from '../../lib/simple-auth'
import { Plus, Edit, Trash2, Car as CarIcon, Calendar, DollarSign, Settings } from 'lucide-react'
import { getCarImage } from '../../lib/image-utils'

export default function FleetAdmin() {
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const filteredCars = cars.filter(car => {
    if (filter === 'all') return true
    if (filter === 'available') return car.available
    if (filter === 'unavailable') return !car.available
    return true
  })

  const getAvailabilityColor = (available: boolean) => {
    return available ? 'text-green-400' : 'text-red-400'
  }

  const getAvailabilityBadge = (available: boolean) => {
    return available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
  }

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Fleet <span className="neon-text">Management</span>
              </h1>
              <p className="text-xl text-gray-300">
                Manage vehicle inventory, pricing, and availability
              </p>
            </div>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-tech font-semibold text-white mb-4">Filter Vehicles</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'available', 'unavailable'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-tech font-medium transition-all duration-300 border ${
                  filter === status
                    ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'bg-dark-metal/50 text-gray-300 border-gray-600/30 hover:text-white hover:border-gray-500/50'
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-neon-blue">{cars.length}</div>
              <div className="text-gray-400">Total Vehicles</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-green-400">{cars.filter(c => c.available).length}</div>
              <div className="text-gray-400">Available</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-red-400">{cars.filter(c => !c.available).length}</div>
              <div className="text-gray-400">Unavailable</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredCars.map(car => (
            <div key={car.id} className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Car Image */}
                <div className="lg:w-1/3">
                  <div className="relative">
                    <img
                      src={getCarImage(car)}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 lg:h-32 object-cover rounded-lg"
                    />
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityBadge(car.available)}`}>
                      {car.available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>

                {/* Car Details */}
                <div className="lg:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-tech font-bold text-white">
                          {car.brand} {car.model} ({car.year})
                        </h3>
                        <p className="text-gray-400">{car.stats.engine} • {car.stats.horsepower} HP • {car.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-neon-blue transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-neon-blue transition-colors">
                          <Settings className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-dark-metal/30 p-3 rounded-lg border border-gray-600/20">
                        <div className="text-sm text-gray-400">Daily Rate</div>
                        <div className="text-lg font-tech font-semibold text-white">
                          ${car.price.daily}
                        </div>
                      </div>
                      <div className="bg-dark-metal/30 p-3 rounded-lg border border-gray-600/20">
                        <div className="text-sm text-gray-400">Weekly Rate</div>
                        <div className="text-lg font-tech font-semibold text-white">
                          ${car.price.weekly}
                        </div>
                      </div>
                      <div className="bg-dark-metal/30 p-3 rounded-lg border border-gray-600/20">
                        <div className="text-sm text-gray-400">Doors</div>
                        <div className="text-lg font-tech font-semibold text-white">
                          {car.stats.doors}
                        </div>
                      </div>
                      <div className="bg-dark-metal/30 p-3 rounded-lg border border-gray-600/20">
                        <div className="text-sm text-gray-400">Category</div>
                        <div className="text-lg font-tech font-semibold text-white capitalize">
                          {car.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {car.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-neon-blue/10 text-neon-blue text-xs rounded-full border border-neon-blue/20"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600/30">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>ID: {car.id}</span>
                      <span className={getAvailabilityColor(car.available)}>
                        {car.available ? '● Available' : '● Unavailable'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        car.available
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
                      }`}>
                        {car.available ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-all duration-300">
                        Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}