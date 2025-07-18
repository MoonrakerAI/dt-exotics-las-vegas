'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  publishedAt: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  seoTitle: string
  seoDescription: string
  featuredImage?: string
}

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Simulate loading blog posts
    setLoading(false)
    setPosts([]) // Empty for now - would connect to CMS/database
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400'
      case 'draft': return 'text-yellow-400'
      case 'archived': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Blog <span className="neon-text">Management</span>
              </h1>
              <p className="text-xl text-gray-300">
                Create and manage blog posts with SEO optimization
              </p>
            </div>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>

        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-tech font-semibold text-white mb-4">Filter Posts</h3>
          <div className="flex flex-wrap gap-2">
            {['all', 'published', 'draft', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-tech font-medium transition-all duration-300 border ${
                  filter === status
                    ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'bg-dark-metal/50 text-gray-300 border-gray-600/30 hover:text-white hover:border-gray-500/50'
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            <p className="text-gray-300 mt-4">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <div className="mb-6">
              <Edit className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-tech font-semibold text-white mb-2">No Blog Posts Yet</h3>
              <p className="text-gray-400 mb-6">Start creating amazing content for your audience</p>
              <button className="btn-primary flex items-center space-x-2 mx-auto">
                <Plus className="w-5 h-5" />
                <span>Create Your First Post</span>
              </button>
            </div>
            
            <div className="border-t border-gray-600/30 pt-6 mt-6">
              <h4 className="text-lg font-tech font-semibold text-white mb-4">Blog Features</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20">
                  <h5 className="font-medium text-neon-blue mb-2">SEO Optimized</h5>
                  <p className="text-gray-400">Custom meta titles, descriptions, and structured data</p>
                </div>
                <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20">
                  <h5 className="font-medium text-neon-blue mb-2">Rich Editor</h5>
                  <p className="text-gray-400">Full WYSIWYG editor with media management</p>
                </div>
                <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20">
                  <h5 className="font-medium text-neon-blue mb-2">Analytics Ready</h5>
                  <p className="text-gray-400">Built-in tracking and performance metrics</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} className="glass-panel bg-dark-metal/50 p-6 mb-6 border border-gray-600/30 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-tech font-bold text-white mb-2">{post.title}</h3>
                    <p className="text-gray-400 mb-2">{post.excerpt}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-500">By {post.author}</span>
                      <span className="text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                      <span className={`font-medium ${getStatusColor(post.status)}`}>
                        {post.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-neon-blue transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-neon-blue transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}