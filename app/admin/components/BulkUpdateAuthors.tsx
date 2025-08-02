'use client'

import { useState } from 'react'
import { RefreshCw, User, CheckCircle, AlertCircle } from 'lucide-react'

export default function BulkUpdateAuthors() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    updatedCount?: number
    adminProfile?: any
  } | null>(null)

  const handleBulkUpdate = async () => {
    setIsUpdating(true)
    setResult(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        setResult({
          success: false,
          message: 'Admin token not found. Please log in again.'
        })
        return
      }

      const response = await fetch('/api/admin/blog/update-author', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          updatedCount: data.updatedCount,
          adminProfile: data.adminProfile
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to update blog authors'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
      <div className="flex items-center space-x-3 mb-4">
        <User className="w-6 h-6 text-neon-blue" />
        <h3 className="text-xl font-tech font-bold text-white">
          Blog Author Profile Sync
        </h3>
      </div>

      <p className="text-gray-300 mb-6">
        Update all existing blog posts to use your current admin profile information 
        (name, avatar, and bio). This ensures all blog posts display consistent author information.
      </p>

      <button
        onClick={handleBulkUpdate}
        disabled={isUpdating}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
          ${isUpdating 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30'
          }
        `}
      >
        <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
        <span>
          {isUpdating ? 'Updating Blog Authors...' : 'Update All Blog Authors'}
        </span>
      </button>

      {result && (
        <div className={`
          mt-6 p-4 rounded-lg border
          ${result.success 
            ? 'bg-green-900/20 border-green-500/30 text-green-300' 
            : 'bg-red-900/20 border-red-500/30 text-red-300'
          }
        `}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium mb-2">{result.message}</p>
              
              {result.success && result.updatedCount !== undefined && (
                <div className="text-sm opacity-90">
                  <p>Updated {result.updatedCount} blog posts</p>
                  
                  {result.adminProfile && (
                    <div className="mt-3 p-3 bg-black/20 rounded border border-gray-600/20">
                      <p className="font-medium mb-2">Current Admin Profile:</p>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-gray-400">Name:</span> {result.adminProfile.name}</p>
                        <p><span className="text-gray-400">Email:</span> {result.adminProfile.email}</p>
                        {result.adminProfile.avatar && (
                          <p><span className="text-gray-400">Avatar:</span> ✅ Set</p>
                        )}
                        {result.adminProfile.bio && (
                          <p><span className="text-gray-400">Bio:</span> ✅ Set</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
