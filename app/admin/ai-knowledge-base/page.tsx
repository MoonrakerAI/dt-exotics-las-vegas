'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface KnowledgeBase {
  fleetInfo: string
  companyInfo: string
  packagesInfo: string
  servicesInfo: string
  lastUpdated: string
}

interface KBStatus {
  lastUpdated: string
  sections: {
    fleet: boolean
    company: boolean
    packages: boolean
    services: boolean
  }
}

export default function AIKnowledgeBasePage() {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [status, setStatus] = useState<KBStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchKnowledgeBase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai-knowledge-base')
      const data = await response.json()
      
      if (data.success) {
        setKnowledgeBase(data.data)
        setMessage({ type: 'success', text: 'Knowledge base loaded successfully' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load knowledge base' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch knowledge base' })
    } finally {
      setLoading(false)
    }
  }

  const updateKnowledgeBase = async () => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/ai-knowledge-base', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.data)
        setMessage({ type: 'success', text: 'Knowledge base updated successfully!' })
        // Refresh the knowledge base data
        await fetchKnowledgeBase()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update knowledge base' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update knowledge base' })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchKnowledgeBase()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getSectionStatus = (content: string | undefined) => {
    if (!content) return { status: 'error', text: 'Missing' }
    if (content.length < 100) return { status: 'warning', text: 'Short' }
    return { status: 'success', text: 'Ready' }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Knowledge Base Management</h1>
        <p className="text-gray-400">
          Manage the dynamic knowledge base that powers the AI concierge on the homepage and chatbot.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-900/20 border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Knowledge Base Control</span>
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={fetchKnowledgeBase}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={updateKnowledgeBase}
              disabled={updating}
              className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              <span>{updating ? 'Updating...' : 'Update Knowledge Base'}</span>
            </button>
          </div>
        </div>

        {knowledgeBase && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last Updated: {formatDate(knowledgeBase.lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Knowledge Base Sections */}
      {knowledgeBase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fleet Information */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Fleet Information</h3>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                getSectionStatus(knowledgeBase.fleetInfo).status === 'success' 
                  ? 'bg-green-900/20 text-green-400' 
                  : getSectionStatus(knowledgeBase.fleetInfo).status === 'warning'
                  ? 'bg-yellow-900/20 text-yellow-400'
                  : 'bg-red-900/20 text-red-400'
              }`}>
                {getSectionStatus(knowledgeBase.fleetInfo).text}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {knowledgeBase.fleetInfo.substring(0, 500)}
                {knowledgeBase.fleetInfo.length > 500 && '...'}
              </pre>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Company Information</h3>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                getSectionStatus(knowledgeBase.companyInfo).status === 'success' 
                  ? 'bg-green-900/20 text-green-400' 
                  : 'bg-red-900/20 text-red-400'
              }`}>
                {getSectionStatus(knowledgeBase.companyInfo).text}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {knowledgeBase.companyInfo.substring(0, 500)}
                {knowledgeBase.companyInfo.length > 500 && '...'}
              </pre>
            </div>
          </div>

          {/* Packages Information */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Packages Information</h3>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                getSectionStatus(knowledgeBase.packagesInfo).status === 'success' 
                  ? 'bg-green-900/20 text-green-400' 
                  : 'bg-red-900/20 text-red-400'
              }`}>
                {getSectionStatus(knowledgeBase.packagesInfo).text}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {knowledgeBase.packagesInfo.substring(0, 500)}
                {knowledgeBase.packagesInfo.length > 500 && '...'}
              </pre>
            </div>
          </div>

          {/* Services Information */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Services Information</h3>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                getSectionStatus(knowledgeBase.servicesInfo).status === 'success' 
                  ? 'bg-green-900/20 text-green-400' 
                  : 'bg-red-900/20 text-red-400'
              }`}>
                {getSectionStatus(knowledgeBase.servicesInfo).text}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {knowledgeBase.servicesInfo.substring(0, 500)}
                {knowledgeBase.servicesInfo.length > 500 && '...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-gray-800/30 rounded-lg border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="space-y-3 text-gray-400 text-sm">
          <p>
            <strong className="text-white">Automatic Updates:</strong> The knowledge base automatically updates whenever cars are added, updated, or removed from the fleet through the admin panel.
          </p>
          <p>
            <strong className="text-white">Manual Updates:</strong> Use the "Update Knowledge Base" button above to manually refresh all sections with the latest information.
          </p>
          <p>
            <strong className="text-white">AI Integration:</strong> The homepage AI concierge and chatbot popup use this knowledge base to provide accurate, up-to-date information about your fleet and services.
          </p>
          <p>
            <strong className="text-white">Fallback System:</strong> If the knowledge base is unavailable, the AI will use a fallback system prompt to ensure continuous operation.
          </p>
        </div>
      </div>
    </div>
  )
}
