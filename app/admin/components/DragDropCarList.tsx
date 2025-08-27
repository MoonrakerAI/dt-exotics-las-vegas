'use client'

import { useState } from 'react'
import { Car } from '@/app/data/cars'
import { getCarImage } from '@/app/lib/image-utils'
import { GripVertical, Save, X } from 'lucide-react'

interface DragDropCarListProps {
  cars: Car[]
  onSave: (reorderedCars: Car[]) => void
  onCancel: () => void
}

export default function DragDropCarList({ cars, onSave, onCancel }: DragDropCarListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [reorderedCars, setReorderedCars] = useState<Car[]>(cars)
  const [saving, setSaving] = useState(false)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newCars = [...reorderedCars]
    const [draggedCar] = newCars.splice(draggedIndex, 1)
    newCars.splice(dropIndex, 0, draggedCar)
    
    setReorderedCars(newCars)
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(reorderedCars)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-metal border border-gray-600/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-600/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-tech font-bold text-white mb-2">
                Reorder Fleet Display
              </h2>
              <p className="text-gray-400">
                Drag and drop cars to change their order on the homepage
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Car List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {reorderedCars.map((car, index) => (
              <div
                key={car.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-dark-metal/50 border border-gray-600/30 rounded-lg p-4 cursor-move transition-all duration-200 ${
                  draggedIndex === index 
                    ? 'opacity-50 scale-95' 
                    : 'hover:border-neon-blue/50 hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-gray-400 hover:text-neon-blue transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Number */}
                  <div className="bg-neon-blue/20 text-neon-blue px-3 py-1 rounded-full text-sm font-tech font-bold min-w-[40px] text-center">
                    {index + 1}
                  </div>

                  {/* Car Image */}
                  <div className="w-16 h-12 rounded overflow-hidden bg-black/20">
                    <img
                      src={getCarImage(car)}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Car Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-tech font-semibold">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {car.year} • {car.category} • ${car.price.daily}/day
                    </p>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex gap-2">
                    {car.available && (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        Available
                      </span>
                    )}
                    {car.showOnHomepage && (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        Homepage
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600/30 flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
