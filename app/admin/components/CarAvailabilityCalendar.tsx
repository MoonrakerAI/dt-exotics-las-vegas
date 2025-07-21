'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X, AlertCircle } from 'lucide-react'

interface BookingInfo {
  id: string
  startDate: string
  endDate: string
  customerName: string
  status: string
}

interface CarAvailabilityCalendarProps {
  carId: string
  carName: string
  onClose: () => void
}

export default function CarAvailabilityCalendar({ carId, carName, onClose }: CarAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [bookingInfo, setBookingInfo] = useState<BookingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAvailabilityData()
  }, [carId])

  const loadAvailabilityData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) return

      // Load custom unavailable dates
      const availabilityRes = await fetch(`/api/admin/fleet/availability?id=${carId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (availabilityRes.ok) {
        const data = await availabilityRes.json()
        setUnavailableDates(data.unavailableDates || [])
      }

      // Load real booking data
      const bookingsRes = await fetch(`/api/admin/fleet/bookings?carId=${carId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (bookingsRes.ok) {
        const bookingData = await bookingsRes.json()
        setBookedDates(bookingData.bookedDates || [])
        setBookingInfo(bookingData.bookings || [])
      }

    } catch (error) {
      console.error('Error loading availability data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAvailability = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch('/api/admin/fleet/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: carId,
          unavailableDates
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Error saving availability')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const isPastDate = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getBookingForDate = (dateStr: string): BookingInfo | null => {
    return bookingInfo.find(booking => {
      const startDate = new Date(booking.startDate).toISOString().split('T')[0]
      const endDate = new Date(booking.endDate).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    }) || null
  }

  const getDateStatus = (date: Date) => {
    const dateStr = formatDate(date)
    
    if (isPastDate(date)) return 'past'
    if (bookedDates.includes(dateStr)) return 'booked'
    if (unavailableDates.includes(dateStr)) return 'unavailable'
    return 'available'
  }

  const getDateClasses = (date: Date, status: string) => {
    const baseClasses = 'w-8 h-8 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-200'
    
    if (status === 'past') {
      return `${baseClasses} text-gray-500 cursor-not-allowed`
    }
    
    if (status === 'booked') {
      return `${baseClasses} bg-orange-500/20 text-orange-300 border border-orange-500/30 cursor-not-allowed`
    }
    
    if (status === 'unavailable') {
      return `${baseClasses} bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30`
    }
    
    // available
    const todayClass = isToday(date) ? 'ring-2 ring-neon-blue' : ''
    return `${baseClasses} bg-green-500/10 text-green-300 border border-green-500/20 hover:bg-green-500/20 ${todayClass}`
  }

  const getTooltipText = (date: Date, status: string): string => {
    const dateStr = formatDate(date)
    
    if (status === 'booked') {
      const booking = getBookingForDate(dateStr)
      if (booking) {
        return `Booked by ${booking.customerName}\n${booking.startDate} to ${booking.endDate}\nStatus: ${booking.status}`
      }
      return `Booked - ${dateStr}`
    }
    
    if (status === 'unavailable') return `Blocked - Click to unblock`
    if (status === 'past') return `Past date - ${dateStr}`
    return `Available - Click to block`
  }

  const toggleDateAvailability = (date: Date) => {
    const dateStr = formatDate(date)
    const status = getDateStatus(date)
    
    if (status === 'past' || status === 'booked') return
    
    if (status === 'unavailable') {
      // Make available
      setUnavailableDates(prev => prev.filter(d => d !== dateStr))
    } else {
      // Make unavailable
      setUnavailableDates(prev => [...prev, dateStr])
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(currentDate)

  // Get current month bookings for display
  const currentMonthBookings = bookingInfo.filter(booking => {
    const bookingStart = new Date(booking.startDate)
    const bookingEnd = new Date(booking.endDate)
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    return (bookingStart <= monthEnd && bookingEnd >= monthStart)
  })

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full bg-dark-metal border border-gray-600/30 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-dark-metal/50 p-6 border-b border-gray-600/30">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-tech font-bold text-white">
                  Availability Calendar
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage availability for {carName}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={saveAvailability}
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading calendar...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Month Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-xl font-tech font-bold text-white">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500/10 border border-green-500/20 rounded"></div>
                      <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded"></div>
                      <span className="text-gray-300">Blocked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/30 rounded"></div>
                      <span className="text-gray-300">Booked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-500/20 rounded"></div>
                      <span className="text-gray-300">Past</span>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day, index) => (
                        <div key={index} className="flex justify-center">
                          {day ? (
                            <div
                              onClick={() => toggleDateAvailability(day)}
                              className={getDateClasses(day, getDateStatus(day))}
                              title={getTooltipText(day, getDateStatus(day))}
                            >
                              {day.getDate()}
                            </div>
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-dark-metal/20 p-4 rounded-lg border border-gray-600/20">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-neon-blue mt-0.5" />
                      <div className="text-sm text-gray-300">
                        <p className="font-medium text-white mb-2">How to use:</p>
                        <ul className="space-y-1 text-gray-400">
                          <li>• Click on available dates (green) to block them</li>
                          <li>• Click on blocked dates (red) to make them available</li>
                          <li>• Booked dates (orange) cannot be changed</li>
                          <li>• Past dates (gray) are read-only</li>
                          <li>• Hover over dates for more details</li>
                          <li>• Don't forget to save your changes!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bookings Sidebar */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-tech font-semibold text-white mb-4">
                      Current Month Bookings
                    </h3>
                    
                    {currentMonthBookings.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No bookings this month
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentMonthBookings.map((booking) => (
                          <div key={booking.id} className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20">
                            <div className="text-sm font-medium text-white mb-1">
                              {booking.customerName}
                            </div>
                            <div className="text-xs text-gray-400 mb-2">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                              booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                              booking.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {booking.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-dark-metal/20 p-4 rounded-lg border border-gray-600/20">
                    <h4 className="text-sm font-medium text-white mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Total Bookings:</span>
                        <span className="text-orange-300">{bookingInfo.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Blocked Dates:</span>
                        <span className="text-red-300">{unavailableDates.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Booked Days:</span>
                        <span className="text-orange-300">{bookedDates.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 