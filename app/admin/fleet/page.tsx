'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Plus, Edit, Trash2, Calendar, ArrowUpDown } from 'lucide-react'
import { getCarImage } from '../../lib/image-utils'
import { Car } from '../../data/cars'
import CarForm from '../components/CarForm'
import CarAvailabilityCalendar from '../components/CarAvailabilityCalendar'
import DragDropCarList from '../components/DragDropCarList'

interface CarAvailabilityStatus {
  [carId: string]: {
    available: boolean;
    hasBookings: boolean;
    hasCustomBlocks: boolean;
  }
}

export default function FleetAdmin() {
  const [cars, setCars] = useState<Car[]>([])
  const [carAvailability, setCarAvailability] = useState<CarAvailabilityStatus>({})
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Car form state
  const [showCarForm, setShowCarForm] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarCar, setCalendarCar] = useState<Car | null>(null)

  // Reorder state
  const [showReorderModal, setShowReorderModal] = useState(false)

  useEffect(() => {
    fetchCars()
  }, [])

  useEffect(() => {
    if (cars.length > 0) {
      checkCarAvailability()
    }
  }, [cars.length])

  const fetchCars = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        setError('No admin token found')
        setLoading(false)
        return
      }
      const res = await fetch('/api/admin/fleet', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to fetch cars')
        setLoading(false)
        return
      }
      const data = await res.json()
      setCars(data.cars || [])
    } catch (e) {
      setError('Failed to fetch cars')
    } finally {
      setLoading(false)
    }
  }

  const checkCarAvailability = async () => {
    const token = localStorage.getItem('dt-admin-token')
    if (!token || cars.length === 0) return

    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    const startDate = today.toISOString().split('T')[0]
    const endDate = nextWeek.toISOString().split('T')[0]

    const availabilityStatus: CarAvailabilityStatus = {}

    const batchSize = 3
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (car) => {
        try {
          const bookingsRes = await fetch(`/api/admin/fleet/bookings?carId=${car.id}&startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          const blocksRes = await fetch(`/api/admin/fleet/availability?id=${car.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          const hasBookings = bookingsRes.ok ? (await bookingsRes.json()).bookedDates?.length > 0 : false
          const customBlocks = blocksRes.ok ? (await blocksRes.json()).unavailableDates || [] : []
          
          const hasCustomBlocks = customBlocks.some((date: string) => {
            const blockDate = new Date(date)
            return blockDate >= today && blockDate <= nextWeek
          })

          const isGenerallyAvailable = car.available
          const isRealTimeAvailable = isGenerallyAvailable && !hasBookings && !hasCustomBlocks

          availabilityStatus[car.id] = {
            available: isRealTimeAvailable,
            hasBookings,
            hasCustomBlocks
          }
        } catch (error) {
          console.error(`Error checking availability for ${car.id}:`, error)
          availabilityStatus[car.id] = {
            available: car.available,
            hasBookings: false,
            hasCustomBlocks: false
          }
        }
      }))

      if (i + batchSize < cars.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    setCarAvailability(availabilityStatus)
  }

  const getUnderbodyLightingClass = (car: Car) => {
    const status = carAvailability[car.id]
    
    if (!car.available) {
      return 'shadow-[0_15px_30px_rgba(239,68,68,0.4)] before:bg-red-500/25'
    }
    
    if (!status) {
      return 'shadow-[0_15px_30px_rgba(34,197,94,0.4)] before:bg-green-500/25'
    }

    if (status.available) {
      return 'shadow-[0_15px_30px_rgba(34,197,94,0.4)] before:bg-green-500/25'
    } else {
      return 'shadow-[0_15px_30px_rgba(239,68,68,0.4)] before:bg-red-500/25'
    }
  }

  const getAvailabilityTooltip = (car: Car) => {
    const status = carAvailability[car.id]
    
    if (!car.available) {
      return 'Car is marked as unavailable'
    }
    
    if (!status) {
      return 'Checking availability...'
    }

    if (status.available) {
      return 'Available - no conflicts in the next 7 days'
    } else {
      const reasons = []
      if (status.hasBookings) reasons.push('has bookings')
      if (status.hasCustomBlocks) reasons.push('has custom blocks')
      return `Unavailable - ${reasons.join(' and ')} in the next 7 days`
    }
  }

  const handleAddCar = () => {
    setEditingCar(null)
    setFormMode('create')
    setShowCarForm(true)
  }

  const handleEditCar = (car: Car) => {
    setEditingCar(car)
    setFormMode('edit')
    setShowCarForm(true)
  }

  const handleDeleteCar = async (car: Car) => {
    if (!confirm(`Are you sure you want to delete ${car.brand} ${car.model}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/fleet?id=${car.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchCars()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting car:', error)
      alert('Error deleting car')
    }
  }

  const handleToggleAvailability = async (car: Car) => {
    const newAvailability = !car.available
    setCars(prev => prev.map(c => 
      c.id === car.id ? { ...c, available: newAvailability } : c
    ))

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/fleet?id=${car.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          available: newAvailability
        })
      })

      if (!response.ok) {
        setCars(prev => prev.map(c => 
          c.id === car.id ? { ...c, available: car.available } : c
        ))
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      setCars(prev => prev.map(c => 
        c.id === car.id ? { ...c, available: car.available } : c
      ))
      alert('Error toggling availability')
    }
  }

  const handleToggleHomepageVisibility = async (car: Car) => {
    const newVisibility = !car.showOnHomepage
    setCars(prev => prev.map(c => 
      c.id === car.id ? { ...c, showOnHomepage: newVisibility } : c
    ))

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/fleet/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: car.id,
          showOnHomepage: newVisibility
        })
      })

      if (!response.ok) {
        setCars(prev => prev.map(c => 
          c.id === car.id ? { ...c, showOnHomepage: car.showOnHomepage } : c
        ))
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling homepage visibility:', error)
      setCars(prev => prev.map(c => 
        c.id === car.id ? { ...c, showOnHomepage: car.showOnHomepage } : c
      ))
      alert('Error toggling homepage visibility')
    }
  }

  const handleOpenCalendar = (car: Car) => {
    setCalendarCar(car)
    setShowCalendar(true)
  }

  const handleCloseCalendar = () => {
    setShowCalendar(false)
    setCalendarCar(null)
    checkCarAvailability()
  }

  const handleFormSave = async (updatedCar?: Car) => {
    setShowCarForm(false)
    setEditingCar(null)
    
    if (updatedCar) {
      setCars(prevCars => {
        const newCars = prevCars.map(car => 
          car.id === updatedCar.id ? updatedCar : car
        )
        return newCars
      })
    }
    
    await fetchCars()
  }

  const handleFormCancel = () => {
    setShowCarForm(false)
    setEditingCar(null)
  }

  const handleReorderCars = async (reorderedCars: Car[]) => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        alert('No admin token found')
        return
      }

      const carOrders = reorderedCars.map((car, index) => ({
        carId: car.id,
        displayOrder: index + 1
      }))

      const response = await fetch('/api/admin/fleet/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ carOrders })
      })

      if (response.ok) {
        setShowReorderModal(false)
        await fetchCars()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error reordering cars:', error)
      alert('Error reordering cars')
    }
  }

  const filteredCars = cars.filter(car => {
    if (filter === 'available') return car.available
    if (filter === 'unavailable') return !car.available
    return true
  })

  if (!SimpleAuth.getCurrentUser()) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-tech mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-tech font-bold text-white mb-2">
              Fleet Management
            </h1>
            <p className="text-xl text-gray-300">
              Manage vehicle inventory, pricing, and availability
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowReorderModal(true)}
              className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all duration-300 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <ArrowUpDown className="w-5 h-5" />
              <span>Reorder Fleet</span>
            </button>
            <button onClick={handleAddCar} className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-tech font-bold text-white mb-2">Vehicle Inventory</h2>
              <p className="text-gray-400">
                {filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'} found
                {filter !== 'all' && ` (filtered from ${cars.length} total)`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50' 
                    : 'bg-dark-metal/50 text-gray-300 border border-gray-600/30 hover:bg-dark-metal/70'
                }`}
              >
                All Vehicles
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  filter === 'available'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-dark-metal/50 text-gray-300 border border-gray-600/30 hover:bg-dark-metal/70'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilter('unavailable')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  filter === 'unavailable'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-dark-metal/50 text-gray-300 border border-gray-600/30 hover:bg-dark-metal/70'
                }`}
              >
                Unavailable
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading vehicles...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">{error}</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No vehicles found.</div>
        ) : (
          <div className="grid gap-6">
            {filteredCars.map(car => (
              <div 
                key={car.id} 
                className={`glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl relative transition-all duration-1000 ease-in-out ${getUnderbodyLightingClass(car)}
                  before:content-[''] before:absolute before:-bottom-4 before:left-1/2 before:-translate-x-1/2 
                  before:w-3/4 before:h-3 before:rounded-full before:blur-md before:transition-all before:duration-1000`}
                title={getAvailabilityTooltip(car)}
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Car Image */}
                  <div className="lg:w-1/3">
                    <div className="relative">
                      <img
                        src={getCarImage(car)}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-56 lg:h-48 object-cover rounded-lg relative z-10"
                      />
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
                          <p className="text-gray-400">{car.stats.engine} • {car.stats.horsepower} HP • {car.category.charAt(0).toUpperCase() + car.category.slice(1)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditCar(car)}
                            className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                            title="Edit car details"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCar(car)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete car"
                          >
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
                          <div className="text-lg font-tech font-semibold text-white">
                            {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4 mb-4">
                        {/* Rental Availability Toggle */}
                        <button
                          onClick={() => handleToggleAvailability(car)}
                          className={`flex items-center space-x-2 px-4 py-2 border transition-all duration-300 rounded-lg ${
                            car.available 
                              ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                            car.available ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-200 ${
                              car.available ? 'translate-x-4' : 'translate-x-1'
                            }`} />
                          </div>
                          <span>Rental Available</span>
                        </button>

                        {/* Homepage Visibility Toggle */}
                        <button
                          onClick={() => handleToggleHomepageVisibility(car)}
                          className={`flex items-center space-x-2 px-4 py-2 border transition-all duration-300 rounded-lg ${
                            car.showOnHomepage 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/30'
                          }`}
                        >
                          <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                            car.showOnHomepage ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-200 ${
                              car.showOnHomepage ? 'translate-x-4' : 'translate-x-1'
                            }`} />
                          </div>
                          <span>Homepage Visibility</span>
                        </button>

                        {/* Calendar Management Button */}
                        <button
                          onClick={() => handleOpenCalendar(car)}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-300 rounded-lg"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Manage Calendar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Car Form Modal */}
        {showCarForm && (
          <CarForm
            car={editingCar || undefined}
            mode={formMode}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        )}

        {/* Calendar Modal */}
        {showCalendar && calendarCar && (
          <CarAvailabilityCalendar
            carId={calendarCar.id}
            carName={`${calendarCar.brand} ${calendarCar.model} (${calendarCar.year})`}
            onClose={handleCloseCalendar}
          />
        )}

        {/* Reorder Cars Modal */}
        {showReorderModal && (
          <DragDropCarList
            cars={cars}
            onSave={handleReorderCars}
            onCancel={() => setShowReorderModal(false)}
          />
        )}
      </div>
    </div>
  )
}
