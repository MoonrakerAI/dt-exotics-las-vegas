'use client'

import { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Upload,
  Car as CarIcon,
  DollarSign,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { Car } from '../../data/cars'

interface CarFormProps {
  car?: Car
  onSave?: (car: Car) => void
  onCancel?: () => void
  mode: 'create' | 'edit'
}

export default function CarForm({ car, onSave, onCancel, mode }: CarFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    id: car?.id || '',
    brand: car?.brand || '',
    model: car?.model || '',
    year: car?.year || new Date().getFullYear(),
    category: car?.category || '',
    stats: {
      horsepower: car?.stats.horsepower || 0,
      torque: car?.stats.torque || 0,
      topSpeed: car?.stats.topSpeed || 0,
      acceleration: car?.stats.acceleration || 0,
      engine: car?.stats.engine || '',
      drivetrain: car?.stats.drivetrain || '',
      doors: car?.stats.doors || 2
    },
    features: car?.features || [],
    price: {
      daily: car?.price.daily || 0,
      weekly: car?.price.weekly || 0
    },
    images: {
      main: car?.images.main || '',
      gallery: car?.images.gallery || []
    },
    videos: {
      showcase: car?.videos?.showcase || ''
    },
    audio: {
      startup: car?.audio?.startup || '',
      rev: car?.audio?.rev || ''
    },
    available: car?.available !== undefined ? car.available : true,
    showOnHomepage: car?.showOnHomepage !== undefined ? car.showOnHomepage : true
  })

  const [newFeature, setNewFeature] = useState('')
  const [newGalleryImage, setNewGalleryImage] = useState('')

  // Auto-generate ID from brand and model
  useEffect(() => {
    if (!formData.id && formData.brand && formData.model) {
      const id = `${formData.brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${formData.model.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      setFormData(prev => ({ ...prev, id }))
    }
  }, [formData.brand, formData.model, formData.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/fleet' : `/api/admin/fleet?id=${car?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedCar = await response.json()
        if (onSave) {
          onSave(savedCar.car || savedCar)
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving car:', error)
      alert('Error saving car')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!car?.id || !confirm('Are you sure you want to delete this car?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/fleet?id=${car.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        }
      })

      if (response.ok) {
        if (onSave) {
          onSave(null as any) // Signal deletion
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting car:', error)
      alert('Error deleting car')
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const addGalleryImage = () => {
    if (newGalleryImage.trim()) {
      setFormData(prev => ({
        ...prev,
        images: {
          ...prev.images,
          gallery: [...prev.images.gallery, newGalleryImage.trim()]
        }
      }))
      setNewGalleryImage('')
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        gallery: prev.images.gallery.filter((_, i) => i !== index)
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto bg-dark-metal border border-gray-600/30 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-dark-metal/50 p-6 border-b border-gray-600/30">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-tech font-bold text-white">
                  {mode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {mode === 'create' ? 'Add a new vehicle to your fleet' : 'Update vehicle details'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {mode === 'edit' && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{loading ? 'Deleting...' : 'Delete'}</span>
                  </button>
                )}
                
                <button
                  onClick={onCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  placeholder="e.g., Lamborghini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  placeholder="e.g., Huracán Spyder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                >
                  <option value="">Select category</option>
                  <option value="Supercar">Supercar</option>
                  <option value="Sports Car">Sports Car</option>
                  <option value="Luxury SUV">Luxury SUV</option>
                  <option value="Performance SUV">Performance SUV</option>
                  <option value="Performance Sedan">Performance Sedan</option>
                  <option value="Electric Performance SUV">Electric Performance SUV</option>
                  <option value="Compact Performance SUV">Compact Performance SUV</option>
                </select>
              </div>
            </div>

            {/* Car ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Car ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                placeholder="e.g., lambo-huracan-spyder"
                disabled={mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">Car ID cannot be changed after creation</p>
              )}
            </div>

            {/* Performance Stats */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Performance Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Horsepower
                  </label>
                  <input
                    type="number"
                    value={formData.stats.horsepower}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, horsepower: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Torque (lb-ft)
                  </label>
                  <input
                    type="number"
                    value={formData.stats.torque}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, torque: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Top Speed (mph)
                  </label>
                  <input
                    type="number"
                    value={formData.stats.topSpeed}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, topSpeed: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    0-60 mph (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stats.acceleration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, acceleration: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Engine
                  </label>
                  <input
                    type="text"
                    value={formData.stats.engine}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, engine: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="e.g., 5.2L V10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Drivetrain
                  </label>
                  <select
                    value={formData.stats.drivetrain}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, drivetrain: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">Select drivetrain</option>
                    <option value="RWD">RWD</option>
                    <option value="FWD">FWD</option>
                    <option value="AWD">AWD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Doors
                  </label>
                  <input
                    type="number"
                    value={formData.stats.doors}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, doors: parseInt(e.target.value) || 2 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="2"
                    max="5"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Daily Rate ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price.daily}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: { ...prev.price, daily: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weekly Rate ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price.weekly}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: { ...prev.price, weekly: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Features</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    className="flex-1 px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="Add a feature..."
                  />
                  <button
                    onClick={addFeature}
                    className="px-4 py-3 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="flex items-center space-x-1 px-3 py-1 bg-neon-blue/10 text-neon-blue text-sm rounded-full border border-neon-blue/20"
                    >
                      <span>{feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Images</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Image URL *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.images.main}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        images: { ...prev.images, main: e.target.value }
                      }))}
                      className="flex-1 px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="https://example.com/car-main.jpg"
                    />
                    <button className="px-4 py-3 bg-dark-gray text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors">
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gallery Images
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newGalleryImage}
                      onChange={(e) => setNewGalleryImage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGalleryImage()}
                      className="flex-1 px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="Add gallery image URL..."
                    />
                    <button
                      onClick={addGalleryImage}
                      className="px-4 py-3 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.images.gallery.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-dark-metal/30 rounded-lg">
                        <span className="text-sm text-gray-300 flex-1 truncate">{image}</span>
                        <button
                          onClick={() => removeGalleryImage(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Showcase Video URL
                  </label>
                  <input
                    type="text"
                    value={formData.videos.showcase}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      videos: { ...prev.videos, showcase: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Startup Audio URL
                  </label>
                  <input
                    type="text"
                    value={formData.audio.startup}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      audio: { ...prev.audio, startup: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="https://example.com/startup.mp3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rev Audio URL
                  </label>
                  <input
                    type="text"
                    value={formData.audio.rev}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      audio: { ...prev.audio, rev: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="https://example.com/rev.mp3"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-tech font-semibold text-white mb-4">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                    className="w-4 h-4 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-gray-300">Vehicle Available for Rental</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.showOnHomepage}
                    onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                    className="w-4 h-4 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-gray-300">Show on Homepage</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 