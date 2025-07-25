'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { AdminProfile } from '../../types/admin'
import { 
  User, 
  Mail, 
  Save, 
  Upload, 
  Camera, 
  Edit3, 
  Shield,
  Calendar,
  Settings
} from 'lucide-react'

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatar: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const user = SimpleAuth.getCurrentUser()
      if (!user) return

      const token = SimpleAuth.getToken()
      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          displayName: data.profile.displayName || data.profile.name,
          bio: data.profile.bio || '',
          avatar: data.profile.avatar || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = SimpleAuth.getToken()
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadProfile()
        setEditMode(false)
        // Show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to blob storage
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const token = SimpleAuth.getToken()
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, avatar: data.url }))
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    }
  }

  if (loading) {
    return (
      <div className="pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            <p className="text-gray-300 mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <p className="text-gray-300 text-lg">Profile not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Admin <span className="neon-text">Profile</span>
              </h1>
              <p className="text-xl text-gray-300">
                Manage your admin profile and display preferences
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden border-4 border-gray-600/30">
                    {previewAvatar || profile.avatar ? (
                      <img
                        src={previewAvatar || profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  
                  {editMode && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-neon-blue rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-400 transition-colors">
                      <Camera className="w-5 h-5 text-black" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-tech font-bold text-white">
                      {profile.displayName || profile.name}
                    </h3>
                    <p className="text-gray-400">{profile.email}</p>
                  </div>

                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    <span>{profile.role.toUpperCase()}</span>
                  </div>

                  <div className="text-gray-400 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm mt-6">
              <h4 className="text-lg font-tech font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Account Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">User ID</span>
                  <span className="text-white font-mono text-sm">{profile.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white text-sm">
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
              <h4 className="text-lg font-tech font-semibold text-white mb-6">
                Profile Details
              </h4>

              <div className="space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                      placeholder="Enter display name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-dark-metal/30 border border-gray-600/20 rounded-lg text-white">
                      {profile.displayName || profile.name}
                    </div>
                  )}
                  <p className="text-gray-400 text-sm mt-1">
                    This name will appear in the admin interface and blog posts
                  </p>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center px-4 py-3 bg-gray-600/20 border border-gray-600/20 rounded-lg text-gray-400">
                    <Mail className="w-5 h-5 mr-3" />
                    <span>{profile.email}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Email cannot be changed from this interface
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  {editMode ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="px-4 py-3 bg-dark-metal/30 border border-gray-600/20 rounded-lg text-white min-h-[100px]">
                      {profile.bio || 'No bio provided'}
                    </div>
                  )}
                  <p className="text-gray-400 text-sm mt-1">
                    Brief description about your role and responsibilities
                  </p>
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <div className="flex items-center px-4 py-3 bg-gray-600/20 border border-gray-600/20 rounded-lg text-gray-400">
                    <Shield className="w-5 h-5 mr-3" />
                    <span className="capitalize">{profile.role}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Role permissions are managed by system administrators
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm mt-6">
              <h4 className="text-lg font-tech font-semibold text-white mb-4">
                Activity Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-dark-metal/30 rounded-lg">
                  <p className="text-2xl font-tech font-bold text-neon-blue">0</p>
                  <p className="text-gray-400 text-sm">Bookings Processed</p>
                </div>
                <div className="text-center p-4 bg-dark-metal/30 rounded-lg">
                  <p className="text-2xl font-tech font-bold text-green-400">0</p>
                  <p className="text-gray-400 text-sm">Payments Captured</p>
                </div>
                <div className="text-center p-4 bg-dark-metal/30 rounded-lg">
                  <p className="text-2xl font-tech font-bold text-purple-400">0</p>
                  <p className="text-gray-400 text-sm">Blog Posts Created</p>
                </div>
                <div className="text-center p-4 bg-dark-metal/30 rounded-lg">
                  <p className="text-2xl font-tech font-bold text-orange-400">0</p>
                  <p className="text-gray-400 text-sm">Invoices Generated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}