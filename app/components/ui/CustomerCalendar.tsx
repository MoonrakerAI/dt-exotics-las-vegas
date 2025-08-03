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
  const [justSelected, setJustSelected] = useState<Set<string>>(new Set())

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

    // Clear previous pulse animations
    setJustSelected(new Set())

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Starting new selection
      setSelectedStartDate(dateStr)
      setSelectedEndDate(null)
      onDateRangeChange?.(dateStr, null)
      
      // Trigger single pulse for selected date
      setJustSelected(new Set([dateStr]))
      setTimeout(() => setJustSelected(new Set()), 600) // Clear after animation
    } else {
      // Completing selection
      const start = new Date(selectedStartDate)
      const end = date
      
      if (end < start) {
        // If end is before start, swap them
        setSelectedStartDate(dateStr)
        setSelectedEndDate(selectedStartDate)
        onDateRangeChange?.(dateStr, selectedStartDate)
        
        // Trigger pulse for both dates
        setJustSelected(new Set([dateStr, selectedStartDate]))
        setTimeout(() => setJustSelected(new Set()), 600)
      } else {
        // Check if range has any unavailable dates
        const hasUnavailableDates = checkRangeAvailability(start, end)
        
        if (hasUnavailableDates) {
          // Reset selection if range contains unavailable dates
          setSelectedStartDate(dateStr)
          setSelectedEndDate(null)
          onDateRangeChange?.(dateStr, null)
          
          // Trigger pulse for new start date
          setJustSelected(new Set([dateStr]))
          setTimeout(() => setJustSelected(new Set()), 600)
        } else {
          setSelectedEndDate(dateStr)
          onDateRangeChange?.(selectedStartDate, dateStr)
          
          // Trigger pulse for entire range
          const rangeDates = []
          const current = new Date(start)
          while (current <= end) {
            rangeDates.push(current.toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
          }
          setJustSelected(new Set(rangeDates))
          setTimeout(() => setJustSelected(new Set()), 600)
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
    const today = new Date()
    const isPast = date < today
    const isToday = dateStr === todayStr
    const isAvailable = availability[dateStr]?.available !== false
    const isSelected = dateStr === selectedStartDate || dateStr === selectedEndDate
    
    let isInRange = false
    let isHovered = false
    let isHoverPreview = false
    let isFinalHover = false
    
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate)
      const end = new Date(selectedEndDate)
      isInRange = date >= start && date <= end
    }
    
    // Enhanced hover preview for range selection
    if (hoveredDate && selectedStartDate && !selectedEndDate) {
      const start = new Date(selectedStartDate)
      const hovered = new Date(hoveredDate)
      const minDate = start < hovered ? start : hovered
      const maxDate = start > hovered ? start : hovered
      
      // Check if the range is valid (no unavailable dates)
      const rangeValid = !checkRangeAvailability(minDate, maxDate)
      
      if (date >= minDate && date <= maxDate) {
        if (rangeValid) {
          // All dates in valid range turn blue (including final hover date)
          isHoverPreview = true
          isFinalHover = true // Make all dates in range appear as blue selection
        } else {
          // Invalid range - show as hovered but not blue
          isHovered = true
        }
      }
    }
    
    return {
      isPast,
      isToday,
      isAvailable,
      isSelected,
      isInRange,
      isHovered,
      isHoverPreview,
      isFinalHover,
      reason: !isAvailable ? availability[dateStr]?.reason : undefined
    }
  }

  const getDateClasses = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const status = getDateStatus(date)
    const isJustSelected = justSelected.has(dateStr)
    
    let classes = 'relative w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center '
    
    if (status.isPast) {
      // Past dates - muted gray (unchanged, no glass effect)
      classes += 'text-gray-500 cursor-not-allowed bg-gray-800/40 border border-gray-700/50'
    } else if (!status.isAvailable) {
      // Unavailable dates - glass effect with red border, brighter inner color
      classes += 'text-white cursor-not-allowed border-2 border-red-400 shadow-sm shadow-red-400/20'
      classes += ' bg-gradient-to-br from-red-400/60 via-red-400/40 to-red-400/60'
      classes += ' backdrop-blur-sm'
    } else if (status.isSelected || status.isInRange || status.isHoverPreview || status.isHovered || status.isFinalHover) {
      // All selection states - glass effect with neon blue border, brighter inner color
      classes += 'text-white border-2 border-neon-blue shadow-lg shadow-neon-blue/40 cursor-pointer'
      classes += ' bg-gradient-to-br from-neon-blue/70 via-neon-blue/50 to-neon-blue/70'
      classes += ' backdrop-blur-sm'
      
      // Add single quick pulse animation if just selected
      if (isJustSelected) {
        classes += ' animate-[pulse_0.6s_ease-out_1]'
      }
    } else {
      // Available dates - glass effect with green border, brighter inner color
      classes += 'text-white font-bold cursor-pointer transition-all duration-300 hover:scale-105'
      classes += ' hover:shadow-lg border-2 border-[#84CD4C]'
      classes += ' bg-gradient-to-br from-[#93DC5C]/60 via-[#93DC5C]/40 to-[#93DC5C]/60'
      classes += ' backdrop-blur-sm'
      classes += ' hover:border-[#75BE3C] hover:from-[#84CD4C]/70 hover:via-[#84CD4C]/50 hover:to-[#84CD4C]/70'
      classes += ' hover:shadow-[#93DC5C]/30'
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
          <div className="grid grid-cols-7 gap-3 mb-2">
            {weekDays.map(day => (
              <div key={day} className="h-12 flex items-center justify-center text-sm font-bold text-gray-300 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((date, index) => (
              <div key={index} className="h-14 flex items-center justify-center">
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
                  </button>
                ) : (
                  <div className="w-12 h-12" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedStartDate || selectedEndDate) && (
        <div className="mt-6 p-6 bg-gradient-to-r from-dark-metal/60 to-dark-metal/40 rounded-xl border border-neon-blue/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="p-1 bg-neon-blue/20 rounded-lg">
                  <Clock className="w-4 h-4 text-neon-blue" />
                </div>
                <span className="font-medium">Selected Dates</span>
              </div>
              <div className="text-white font-semibold text-lg">
                {selectedStartDate && new Date(selectedStartDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {selectedEndDate && (
                  <>
                    <span className="mx-3 text-neon-blue">→</span>
                    {new Date(selectedEndDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </>
                )}
                {!selectedEndDate && selectedStartDate && (
                  <span className="ml-3 text-gray-400 text-sm font-normal">(Select end date)</span>
                )}
              </div>
            </div>
            
            {calculateTotalPrice() && (
              <div className="text-right">
                <div className="flex items-center justify-end space-x-3 text-sm text-gray-300 mb-1">
                  <div className="p-1 bg-[#93DC5C]/20 rounded-lg">
                    <DollarSign className="w-4 h-4 text-[#93DC5C]" />
                  </div>
                  <span className="font-medium">Total Cost</span>
                </div>
                <div className="text-3xl font-tech font-bold text-transparent bg-gradient-to-r from-neon-blue to-[#93DC5C] bg-clip-text">
                  ${calculateTotalPrice()?.toLocaleString()}
                </div>
                {selectedStartDate && selectedEndDate && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 3600 * 24))} days
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-[#84CD4C] rounded-lg shadow-sm shadow-[#93DC5C]/30 bg-gradient-to-br from-[#93DC5C]/60 via-[#93DC5C]/40 to-[#93DC5C]/60 backdrop-blur-sm"></div>
          <span className="text-gray-300 font-medium">Available</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-red-400 rounded-lg shadow-sm shadow-red-400/20 bg-gradient-to-br from-red-400/60 via-red-400/40 to-red-400/60 backdrop-blur-sm"></div>
          <span className="text-gray-300 font-medium">Unavailable</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-neon-blue rounded-lg shadow-lg shadow-neon-blue/40 bg-gradient-to-br from-neon-blue/70 via-neon-blue/50 to-neon-blue/70 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">✓</div>
          <span className="text-gray-300 font-medium">Selected</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-800/40 border border-gray-700/50 rounded-lg"></div>
          <span className="text-gray-300 font-medium">Past</span>
        </div>
      </div>
    </div>
  )
} 