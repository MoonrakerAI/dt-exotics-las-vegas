'use client'

import { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface CustomerCalendarProps {
  onDateRangeChange?: (startDate: string | null, endDate: string | null) => void
  selectedCarId?: string
  dailyRate?: number
  minDays?: number
  maxDays?: number
  className?: string
}

interface AvailabilityData {
  [date: string]: {
    available: boolean
    reason?: string
    price?: number
  }
}

export default function CustomerCalendar({ 
  onDateRangeChange, 
  selectedCarId,
  dailyRate,
  minDays = 1,
  maxDays = 30,
  className = '' 
}: CustomerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [availability, setAvailability] = useState<AvailabilityData>({})
  const [loading, setLoading] = useState(false)

  // Get calendar data for current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  // Fetch availability data when car or month changes
  useEffect(() => {
    if (selectedCarId) {
      fetchAvailability()
    }
  }, [selectedCarId, currentDate])

  const fetchAvailability = async () => {
    if (!selectedCarId) return

    setLoading(true)
    try {
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const response = await fetch(`/api/cars/availability?carId=${selectedCarId}&startDate=${startOfMonth}&endDate=${endOfMonth}`)
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || {})
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Don't allow past dates
    if (date < today) return
    
    // Don't allow unavailable dates
    if (availability[dateStr] && !availability[dateStr].available) return

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Starting new selection
      setSelectedStartDate(dateStr)
      setSelectedEndDate(null)
      onDateRangeChange?.(dateStr, null)
    } else {
      // Completing selection
      const start = new Date(selectedStartDate)
      const end = date
      
      if (end < start) {
        // If end is before start, swap them
        setSelectedStartDate(dateStr)
        setSelectedEndDate(selectedStartDate)
        onDateRangeChange?.(dateStr, selectedStartDate)
      } else {
        // Check if range has any unavailable dates
        const hasUnavailableDates = checkRangeAvailability(start, end)
        
        if (hasUnavailableDates) {
          // Reset selection if range contains unavailable dates
          setSelectedStartDate(dateStr)
          setSelectedEndDate(null)
          onDateRangeChange?.(dateStr, null)
        } else {
          setSelectedEndDate(dateStr)
          onDateRangeChange?.(selectedStartDate, dateStr)
        }
      }
    }
  }

  const checkRangeAvailability = (start: Date, end: Date): boolean => {
    const current = new Date(start)
    current.setDate(current.getDate() + 1) // Skip start date
    
    while (current < end) {
      const dateStr = current.toISOString().split('T')[0]
      if (availability[dateStr] && !availability[dateStr].available) {
        return true // Found unavailable date
      }
      current.setDate(current.getDate() + 1)
    }
    return false
  }

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const isPast = date < today
    const isToday = dateStr === todayStr
    const isSelected = dateStr === selectedStartDate || dateStr === selectedEndDate
    const isInRange = selectedStartDate && selectedEndDate && 
      dateStr > selectedStartDate && dateStr < selectedEndDate
    const isHovered = selectedStartDate && !selectedEndDate && hoveredDate &&
      ((dateStr > selectedStartDate && dateStr <= hoveredDate) ||
       (dateStr < selectedStartDate && dateStr >= hoveredDate))
    const availData = availability[dateStr]
    const isAvailable = !isPast && (!availData || availData.available)

    return {
      isPast,
      isToday,
      isSelected,
      isInRange,
      isHovered,
      isAvailable,
      reason: availData?.reason
    }
  }

  const getDateClasses = (date: Date) => {
    const status = getDateStatus(date)
    let classes = "relative h-12 w-12 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer"

    if (status.isPast) {
      classes += " text-gray-500 cursor-not-allowed opacity-50"
    } else if (!status.isAvailable) {
      classes += " bg-red-500/20 text-red-300 cursor-not-allowed border border-red-500/30"
    } else if (status.isSelected) {
      classes += " bg-neon-blue text-black font-bold scale-105 shadow-lg shadow-neon-blue/50"
    } else if (status.isInRange || status.isHovered) {
      classes += " bg-neon-blue/30 text-white border border-neon-blue/50"
    } else if (status.isToday) {
      classes += " bg-gray-600 text-white border-2 border-neon-blue"
    } else {
      classes += " text-gray-300 hover:bg-gray-700 hover:text-white"
    }

    return classes
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const calculateTotalPrice = () => {
    if (!selectedStartDate || !selectedEndDate || !dailyRate) return null
    
    const start = new Date(selectedStartDate)
    const end = new Date(selectedEndDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return days * dailyRate
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={`bg-dark-metal border border-gray-600/30 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-neon-blue" />
          <h3 className="text-xl font-tech font-semibold text-white">
            Select Rental Dates
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-neon-blue transition-colors rounded-lg hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h4 className="text-lg font-medium text-white min-w-48 text-center">
            {formatMonthYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-neon-blue transition-colors rounded-lg hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="space-y-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => (
              <div key={index} className="h-12 flex items-center justify-center">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => setHoveredDate(date.toISOString().split('T')[0])}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={getDateClasses(date)}
                    disabled={getDateStatus(date).isPast || !getDateStatus(date).isAvailable}
                    title={getDateStatus(date).reason}
                  >
                    {date.getDate()}
                    
                    {/* Availability indicator */}
                    {!getDateStatus(date).isPast && (
                      <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
                        getDateStatus(date).isAvailable ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                    )}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedStartDate || selectedEndDate) && (
        <div className="mt-6 p-4 bg-dark-metal/50 rounded-lg border border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Selected Dates:</span>
              </div>
              <div className="text-white font-medium">
                {selectedStartDate && new Date(selectedStartDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {selectedEndDate && (
                  <>
                    {' → '}
                    {new Date(selectedEndDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </>
                )}
              </div>
            </div>
            
            {calculateTotalPrice() && (
              <div className="text-right">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>Total:</span>
                </div>
                <div className="text-2xl font-tech font-bold text-neon-blue">
                  ${calculateTotalPrice()?.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  )
} 