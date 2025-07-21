'use client'

import { useState, useEffect, useRef } from 'react'
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
  EyeOff,
  Search,
  Loader2,
  Image as ImageIcon,
  Music,
  Play,
  Pause
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
  const [autoPopulateLoading, setAutoPopulateLoading] = useState(false)
  const [vehicleSuggestions, setVehicleSuggestions] = useState<{
    makes: string[];
    models: string[];
  }>({ makes: [], models: [] })
  const [showSuggestions, setShowSuggestions] = useState({
    make: false,
    model: false
  })
  const [uploadingFiles, setUploadingFiles] = useState<{
    mainImage: boolean;
    galleryImages: boolean;
    startupAudio: boolean;
    revAudio: boolean;
  }>({
    mainImage: false,
    galleryImages: false,
    startupAudio: false,
    revAudio: false
  })
  
  // File upload refs
  const mainImageRef = useRef<HTMLInputElement>(null)
  const galleryImagesRef = useRef<HTMLInputElement>(null)
  const startupAudioRef = useRef<HTMLInputElement>(null)
  const revAudioRef = useRef<HTMLInputElement>(null)

  // Audio preview state
  const [audioPreview, setAudioPreview] = useState<{
    startup?: HTMLAudioElement;
    rev?: HTMLAudioElement;
  }>({})
  const [playingAudio, setPlayingAudio] = useState<'startup' | 'rev' | null>(null)
  
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
  const [imagePreview, setImagePreview] = useState<{
    main?: string;
    gallery: string[];
  }>({
    main: car?.images.main,
    gallery: car?.images.gallery || []
  })

  // Auto-generate ID from brand and model
  useEffect(() => {
    if (!formData.id && formData.brand && formData.model) {
      const id = `${formData.brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${formData.model.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${formData.year}`
      setFormData(prev => ({ ...prev, id }))
    }
  }, [formData.brand, formData.model, formData.year, formData.id])

  // Fetch vehicle suggestions when user types
  const fetchVehicleSuggestions = async (make: string, model?: string) => {
    if (make.length < 2) {
      setVehicleSuggestions({ makes: [], models: [] })
      return
    }

    try {
      const params = new URLSearchParams({ make })
      if (model && model.length >= 2) {
        params.append('model', model)
      }

      const response = await fetch(`/api/admin/vehicle-suggestions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setVehicleSuggestions(result.suggestions)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  // Debounced suggestion fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.brand.length >= 2) {
        fetchVehicleSuggestions(formData.brand, formData.model)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [formData.brand, formData.model])

     // Auto-populate vehicle data
   const handleAutoPopulate = async () => {
     if (!formData.brand || !formData.model || !formData.year) {
       alert('Please enter Year, Make (Brand), and Model first')
       return
     }

     setAutoPopulateLoading(true)
     try {
       const response = await fetch(`/api/admin/vehicle-lookup?year=${formData.year}&make=${encodeURIComponent(formData.brand)}&model=${encodeURIComponent(formData.model)}`, {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
         }
       })

       const result = await response.json()
       
       if (response.ok && result.success && result.data) {
         const specs = result.data
        
                 // Update form with retrieved data - overwrite existing fields
         setFormData(prev => ({
           ...prev,
           brand: specs.make,
           model: specs.model,
           category: specs.category || prev.category,
           stats: {
             ...prev.stats,
             horsepower: specs.horsepower !== undefined ? specs.horsepower : prev.stats.horsepower,
             topSpeed: specs.topSpeed !== undefined ? specs.topSpeed : prev.stats.topSpeed,
             acceleration: specs.acceleration !== undefined ? (typeof specs.acceleration === 'string' ? parseFloat(specs.acceleration) : specs.acceleration) : prev.stats.acceleration,
             engine: specs.engine || prev.stats.engine,
             drivetrain: specs.drivetrain || prev.stats.drivetrain,
             doors: specs.doors !== undefined ? specs.doors : prev.stats.doors
           },
           features: specs.features && specs.features.length > 0 ? specs.features : prev.features
         }))

        // Update image previews if stock images are available
        if (specs.stockImages?.main) {
          setImagePreview(prev => ({
            ...prev,
            main: specs.stockImages!.main
          }))
          setFormData(prev => ({
            ...prev,
            images: {
              ...prev.images,
              main: specs.stockImages!.main!
            }
          }))
        }

        if (specs.stockImages?.gallery?.length) {
          setImagePreview(prev => ({
            ...prev,
            gallery: specs.stockImages!.gallery!
          }))
          setFormData(prev => ({
            ...prev,
            images: {
              ...prev.images,
              gallery: specs.stockImages!.gallery!
            }
          }))
        }

        alert('Vehicle data populated successfully! Review and adjust as needed.')
      } else {
        alert(result.error || 'Failed to find vehicle data. Please enter details manually.')
      }
    } catch (error) {
      console.error('Auto-populate error:', error)
      alert('Error fetching vehicle data. Please try again.')
    } finally {
      setAutoPopulateLoading(false)
    }
  }

  // Handle main image upload
  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFiles(prev => ({ ...prev, mainImage: true }))

    try {
      // Create form data for upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('carId', formData.id || 'temp')
      uploadFormData.append('fileType', 'image')
      uploadFormData.append('uploadType', 'main')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        },
        body: uploadFormData
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        const imageUrl = result.urls?.optimized || result.urls?.original
        console.log('Upload successful:', { result, imageUrl })
        setFormData(prev => ({
          ...prev,
          images: { ...prev.images, main: imageUrl }
        }))
        setImagePreview(prev => ({ ...prev, main: imageUrl }))
        
        // Clear the file input to allow re-upload of same file
        if (mainImageRef.current) {
          mainImageRef.current.value = ''
        }
      } else {
        console.error('Upload error:', result)
        
        // If blob storage is not configured, fall back to base64
        if (result.fallback || response.status === 503) {
          console.log('Falling back to base64 storage')
          const base64 = await convertFileToBase64(file)
          setFormData(prev => ({
            ...prev,
            images: { ...prev.images, main: base64 }
          }))
          setImagePreview(prev => ({ ...prev, main: base64 }))
          
          if (mainImageRef.current) {
            mainImageRef.current.value = ''
          }
        } else {
          alert(result.error || 'Failed to upload image')
        }
      }
    } catch (error) {
      console.error('Upload exception:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingFiles(prev => ({ ...prev, mainImage: false }))
    }
  }

  // Handle gallery images upload
  const handleGalleryImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(prev => ({ ...prev, galleryImages: true }))

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('carId', formData.id || 'temp')
        uploadFormData.append('fileType', 'image')
        uploadFormData.append('uploadType', 'gallery')
        uploadFormData.append('index', index.toString())

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
          },
          body: uploadFormData
        })

        return response.json()
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(r => r.success)
      
      if (successfulUploads.length > 0) {
        const newUrls = successfulUploads.map(r => r.urls.optimized || r.urls.original)
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            gallery: [...prev.images.gallery, ...newUrls]
          }
        }))
        setImagePreview(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...newUrls]
        }))
      }

      const failures = results.filter(r => !r.success)
      if (failures.length > 0) {
        alert(`Some files failed to upload: ${failures.map(f => f.error).join(', ')}`)
      }
      
      // Clear the file input
      if (galleryImagesRef.current) {
        galleryImagesRef.current.value = ''
      }
    } catch (error) {
      console.error('Gallery upload error:', error)
      alert('Failed to upload gallery images')
    } finally {
      setUploadingFiles(prev => ({ ...prev, galleryImages: false }))
    }
  }

  // Handle audio upload
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'startup' | 'rev') => {
    const file = event.target.files?.[0]
    if (!file) return

    const uploadKey = type === 'startup' ? 'startupAudio' : 'revAudio'
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }))

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('carId', formData.id || 'temp')
      uploadFormData.append('fileType', 'audio')
      uploadFormData.append('uploadType', type)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        },
        body: uploadFormData
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        const audioUrl = result.urls.original
        setFormData(prev => ({
          ...prev,
          audio: { ...prev.audio, [type]: audioUrl }
        }))

        // Create audio preview
        const audio = new Audio(audioUrl)
        setAudioPreview(prev => ({ ...prev, [type]: audio }))
        
        // Clear the file input
        const inputRef = type === 'startup' ? startupAudioRef : revAudioRef
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      } else {
        console.error('Audio upload error:', result)
        alert(result.error || 'Failed to upload audio file')
      }
    } catch (error) {
      console.error('Audio upload exception:', error)
      alert('Failed to upload audio file. Please try again.')
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }))
    }
  }

  // Play/pause audio preview
  const toggleAudioPreview = (type: 'startup' | 'rev') => {
    const audio = audioPreview[type]
    if (!audio) return

    if (playingAudio === type) {
      audio.pause()
      audio.currentTime = 0
      setPlayingAudio(null)
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioPreview[playingAudio]
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }
      
      audio.play()
      setPlayingAudio(type)
      
      // Reset playing state when audio ends
      audio.onended = () => setPlayingAudio(null)
    }
  }

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        gallery: prev.images.gallery.filter((_, i) => i !== index)
      }
    }))
    setImagePreview(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }))
  }

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
      console.error('Save error:', error)
      alert('Error saving car')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!car || mode !== 'edit') return
    
    if (!confirm(`Are you sure you want to delete ${car.brand} ${car.model}?`)) {
      return
    }

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
      console.error('Delete error:', error)
      alert('Error deleting car')
    }
  }

  // Helper function for base64 conversion
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = () => reject(new Error('File reading failed'))
      reader.readAsDataURL(file)
    })
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

     const updateFormField = (field: string, value: any) => {
     if (field.includes('.')) {
       const [parent, child] = field.split('.')
       setFormData(prev => ({
         ...prev,
         [parent]: {
           ...(prev[parent as keyof typeof prev] as object),
           [child]: value
         }
       }))
     } else {
       setFormData(prev => ({ ...prev, [field]: value }))
     }
   }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto bg-dark-metal border border-gray-600/30 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-dark-metal/50 p-6 border-b border-gray-600/30">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-tech font-bold text-white">
                  {mode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {mode === 'create' ? 'Add a new vehicle to your fleet' : `Editing ${car?.brand} ${car?.model}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {mode === 'edit' && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-300 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                
                <button
                  onClick={onCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-8">
            {/* Auto-Populate Section */}
            <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-6">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Auto-Populate Vehicle Data</span>
              </h2>
              <p className="text-gray-300 mb-4">
                Enter Year, Make, and Model below, then click "Auto-Populate" to automatically fill in vehicle specifications and stock photos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => updateFormField('year', parseInt(e.target.value) || new Date().getFullYear())}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Make (Brand)</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => {
                      updateFormField('brand', e.target.value)
                      setShowSuggestions(prev => ({ ...prev, make: true }))
                    }}
                    onFocus={() => setShowSuggestions(prev => ({ ...prev, make: true }))}
                    onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, make: false })), 200)}
                    placeholder="e.g., Lamborghini, Ferrari, Porsche"
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                  
                  {/* Make Suggestions Dropdown */}
                  {showSuggestions.make && vehicleSuggestions.makes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-dark-metal border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {vehicleSuggestions.makes.map((make, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            updateFormField('brand', make)
                            setShowSuggestions(prev => ({ ...prev, make: false }))
                          }}
                          className="px-4 py-2 text-gray-300 hover:bg-neon-blue/20 hover:text-white cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          {make}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => {
                      updateFormField('model', e.target.value)
                      setShowSuggestions(prev => ({ ...prev, model: true }))
                    }}
                    onFocus={() => setShowSuggestions(prev => ({ ...prev, model: true }))}
                    onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, model: false })), 200)}
                    placeholder="e.g., Huracan, 488 GTB, 911"
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                  
                  {/* Model Suggestions Dropdown */}
                  {showSuggestions.model && vehicleSuggestions.models.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-dark-metal border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {vehicleSuggestions.models.map((model, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            updateFormField('model', model)
                            setShowSuggestions(prev => ({ ...prev, model: false }))
                          }}
                          className="px-4 py-2 text-gray-300 hover:bg-neon-blue/20 hover:text-white cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          {model}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <button
                    onClick={handleAutoPopulate}
                    disabled={autoPopulateLoading || !formData.brand || !formData.model}
                    className="w-full btn-primary disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {autoPopulateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                                                 <Search className="w-5 h-5" />
                         <span>Auto-Populate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <CarIcon className="w-5 h-5" />
                <span>Basic Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Car ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => updateFormField('id', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="Auto-generated from brand and model"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormField('category', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    <option value="exotic">Exotic</option>
                    <option value="luxury">Luxury</option>
                    <option value="sports">Sports</option>
                    <option value="suv">SUV</option>
                    <option value="convertible">Convertible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4">Performance Stats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Horsepower</label>
                  <input
                    type="number"
                    value={formData.stats.horsepower}
                    onChange={(e) => updateFormField('stats.horsepower', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Top Speed (MPH)</label>
                  <input
                    type="number"
                    value={formData.stats.topSpeed}
                    onChange={(e) => updateFormField('stats.topSpeed', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">0-60 MPH (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stats.acceleration}
                    onChange={(e) => updateFormField('stats.acceleration', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Engine</label>
                  <input
                    type="text"
                    value={formData.stats.engine}
                    onChange={(e) => updateFormField('stats.engine', e.target.value)}
                    placeholder="e.g., 5.2L V10"
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Drivetrain</label>
                  <select
                    value={formData.stats.drivetrain}
                    onChange={(e) => updateFormField('stats.drivetrain', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">Select Drivetrain</option>
                    <option value="RWD">RWD (Rear-Wheel Drive)</option>
                    <option value="AWD">AWD (All-Wheel Drive)</option>
                    <option value="FWD">FWD (Front-Wheel Drive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Doors</label>
                  <select
                    value={formData.stats.doors}
                    onChange={(e) => updateFormField('stats.doors', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value={2}>2 Doors</option>
                    <option value={4}>4 Doors</option>
                    <option value={5}>5 Doors</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Pricing</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Daily Rate ($)</label>
                  <input
                    type="number"
                    value={formData.price.daily}
                    onChange={(e) => updateFormField('price.daily', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Weekly Rate ($)</label>
                  <input
                    type="number"
                    value={formData.price.weekly}
                    onChange={(e) => updateFormField('price.weekly', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Suggested: ${formData.price.daily * 6} (6x daily rate)
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4">Features</h2>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  placeholder="Add a feature..."
                  className="flex-1 px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                />
                <button
                  onClick={addFeature}
                  className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-full text-sm"
                  >
                    <span>{feature}</span>
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-neon-blue/70 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5" />
                <span>Images</span>
              </h2>
              
              {/* Main Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Main Image</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  {imagePreview.main ? (
                    <div className="relative">
                      <img 
                        src={imagePreview.main} 
                        alt="Main car image" 
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <button
                        onClick={() => {
                          setImagePreview(prev => ({ ...prev, main: undefined }))
                          setFormData(prev => ({ ...prev, images: { ...prev.images, main: '' } }))
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p className="mb-2">Upload main car image</p>
                      <p className="text-sm">JPG, PNG, WebP up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={mainImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => mainImageRef.current?.click()}
                    disabled={uploadingFiles.mainImage}
                    className="mt-4 btn-primary disabled:opacity-50 flex items-center justify-center space-x-2 w-full"
                  >
                    {uploadingFiles.mainImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>{imagePreview.main ? 'Change Image' : 'Upload Image'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gallery Images</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center mb-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400 mb-2">Upload gallery images (max 10)</p>
                  <p className="text-sm text-gray-500">JPG, PNG, WebP up to 10MB each</p>
                  <input
                    ref={galleryImagesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => galleryImagesRef.current?.click()}
                    disabled={uploadingFiles.galleryImages}
                    className="mt-4 btn-primary disabled:opacity-50 flex items-center justify-center space-x-2 w-full"
                  >
                    {uploadingFiles.galleryImages ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Images</span>
                    )}
                  </button>
                </div>
                
                {imagePreview.gallery.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreview.gallery.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image} 
                          alt={`Gallery image ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeGalleryImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Audio Files */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <Music className="w-5 h-5" />
                <span>Audio Files</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Startup Sound */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Startup Sound</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    {formData.audio.startup ? (
                      <div className="space-y-2">
                        <Music className="w-8 h-8 mx-auto text-green-400" />
                        <p className="text-sm text-gray-300">Startup audio uploaded</p>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => toggleAudioPreview('startup')}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30"
                          >
                            {playingAudio === 'startup' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span className="text-xs">{playingAudio === 'startup' ? 'Pause' : 'Play'}</span>
                          </button>
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, audio: { ...prev.audio, startup: '' } }))}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-xs">Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Music className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">MP3, WAV, M4A up to 50MB</p>
                      </div>
                    )}
                    <input
                      ref={startupAudioRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleAudioUpload(e, 'startup')}
                      className="hidden"
                    />
                    <button
                      onClick={() => startupAudioRef.current?.click()}
                      disabled={uploadingFiles.startupAudio}
                      className="mt-2 btn-primary text-sm disabled:opacity-50 flex items-center justify-center space-x-2 w-full"
                    >
                      {uploadingFiles.startupAudio ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>{formData.audio.startup ? 'Change Audio' : 'Upload Audio'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Rev Sound */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rev Sound</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    {formData.audio.rev ? (
                      <div className="space-y-2">
                        <Music className="w-8 h-8 mx-auto text-green-400" />
                        <p className="text-sm text-gray-300">Rev audio uploaded</p>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => toggleAudioPreview('rev')}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30"
                          >
                            {playingAudio === 'rev' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span className="text-xs">{playingAudio === 'rev' ? 'Pause' : 'Play'}</span>
                          </button>
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, audio: { ...prev.audio, rev: '' } }))}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-xs">Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Music className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">MP3, WAV, M4A up to 50MB</p>
                      </div>
                    )}
                    <input
                      ref={revAudioRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleAudioUpload(e, 'rev')}
                      className="hidden"
                    />
                    <button
                      onClick={() => revAudioRef.current?.click()}
                      disabled={uploadingFiles.revAudio}
                      className="mt-2 btn-primary text-sm disabled:opacity-50 flex items-center justify-center space-x-2 w-full"
                    >
                      {uploadingFiles.revAudio ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>{formData.audio.rev ? 'Change Audio' : 'Upload Audio'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video (URL) */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4">Video</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Showcase Video URL</label>
                <input
                  type="url"
                  value={formData.videos.showcase}
                  onChange={(e) => updateFormField('videos.showcase', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  YouTube, Vimeo, or direct video URL
                </p>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-dark-metal/20 rounded-lg p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-semibold text-white mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Available for Rental</label>
                    <p className="text-xs text-gray-400">Controls if this car can be booked</p>
                  </div>
                  <button
                    onClick={() => updateFormField('available', !formData.available)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.available ? 'bg-neon-blue' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.available ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Show on Homepage</label>
                    <p className="text-xs text-gray-400">Display this car on the main fleet page</p>
                  </div>
                  <button
                    onClick={() => updateFormField('showOnHomepage', !formData.showOnHomepage)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.showOnHomepage ? 'bg-neon-blue' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.showOnHomepage ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 