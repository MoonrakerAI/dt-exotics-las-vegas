'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Plus, Edit, Trash2, Eye, Calendar, Search, Filter, Tag, FolderOpen, X, Clock } from 'lucide-react'
import { BlogPost, BlogCategory, BlogTag } from '../../types/blog'
import BlogEditor from '../components/BlogEditor'

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showScheduled, setShowScheduled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    archived: 0
  })
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editTagName, setEditTagName] = useState('')

  useEffect(() => {
    loadPosts()
    loadCategoriesAndTags()
    updatePostCounts() // Update post counts on initial load
  }, [filter, searchQuery])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      let url = '/api/admin/blog'
      const params = new URLSearchParams()
      
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Loaded posts data:', data)
        setPosts(data.posts || data)
        
        // Calculate stats
        const allPosts = data.posts || data
        console.log('All posts after save:', allPosts.map((p: BlogPost) => ({ id: p.id, status: p.status, scheduledFor: p.scheduledFor })))
        setStats({
          total: allPosts.length,
          published: allPosts.filter((p: BlogPost) => p.status === 'published').length,
          draft: allPosts.filter((p: BlogPost) => p.status === 'draft').length,
          scheduled: allPosts.filter((p: BlogPost) => p.status === 'scheduled').length,
          archived: allPosts.filter((p: BlogPost) => p.status === 'archived').length
        })
      } else {
        console.error('Failed to load posts')
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriesAndTags = async () => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const [categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/admin/blog/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/admin/blog/tags', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
      
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }
    } catch (error) {
      console.error('Error loading categories and tags:', error)
    }
  }

  const updatePostCounts = async () => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      await Promise.all([
        fetch('/api/admin/blog/categories/update-counts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/admin/blog/tags/update-counts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])
      // Reload categories and tags to get updated counts
      loadCategoriesAndTags()
    } catch (error) {
      console.error('Error updating post counts:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400'
      case 'draft': return 'text-yellow-400'
      case 'scheduled': return 'text-blue-400'
      case 'archived': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const handleCreatePost = () => {
    setEditingPost(null)
    setShowEditor(true)
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setShowEditor(true)
  }

  const handleSavePost = async (savedPost: BlogPost) => {
    setShowEditor(false)
    setEditingPost(null)
    console.log('Saving post, reloading data...')
    await loadPosts() // Reload the posts list
    await updatePostCounts() // Update post counts for categories and tags
    console.log('Data reloaded after save')
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingPost(null)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadPosts() // Reload the posts list
        await updatePostCounts() // Update post counts for categories and tags
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    }
  }

  const addCategory = async () => {
    if (!newCategory.trim()) return

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategory.trim() })
      })

      if (response.ok) {
        setNewCategory('')
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Error adding category')
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all posts using it.')) {
      return
    }

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/blog/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const addTag = async () => {
    if (!newTag.trim()) return

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTag.trim() })
      })

      if (response.ok) {
        setNewTag('')
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      alert('Error adding tag')
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will affect all posts using it.')) {
      return
    }

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/blog/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Error deleting tag')
    }
  }

  const startEditCategory = (category: BlogCategory) => {
    setEditingCategory(category.id)
    setEditCategoryName(category.name)
  }

  const saveEditCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/blog/categories/${editingCategory}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editCategoryName.trim() })
      })

      if (response.ok) {
        setEditingCategory(null)
        setEditCategoryName('')
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error updating category')
    }
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setEditCategoryName('')
  }

  const startEditTag = (tag: BlogTag) => {
    setEditingTag(tag.id)
    setEditTagName(tag.name)
  }

  const saveEditTag = async () => {
    if (!editingTag || !editTagName.trim()) return

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/blog/tags/${editingTag}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editTagName.trim() })
      })

      if (response.ok) {
        setEditingTag(null)
        setEditTagName('')
        loadCategoriesAndTags()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Error updating tag')
    }
  }

  const cancelEditTag = () => {
    setEditingTag(null)
    setEditTagName('')
  }

  if (showEditor) {
    return (
      <BlogEditor
        post={editingPost || undefined}
        mode={editingPost ? 'edit' : 'create'}
        onSave={handleSavePost}
        onCancel={handleCancelEdit}
      />
    )
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
            <button 
              onClick={handleCreatePost}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>

        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-lg font-tech font-semibold text-white">Filter & Search</h3>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full lg:w-80 pl-10 pr-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Posts</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-green-400">{stats.published}</div>
              <div className="text-gray-400 text-sm">Published</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-yellow-400">{stats.draft}</div>
              <div className="text-gray-400 text-sm">Drafts</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-blue-400">{stats.scheduled}</div>
              <div className="text-gray-400 text-sm">Scheduled</div>
            </div>
            <div className="bg-dark-metal/30 p-4 rounded-lg border border-gray-600/20 text-center">
              <div className="text-2xl font-tech font-bold text-gray-400">{stats.archived}</div>
              <div className="text-gray-400 text-sm">Archived</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'published', 'draft', 'scheduled', 'archived'].map(status => (
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

          {/* Scheduled Posts Summary */}
          {posts.filter(post => post.status === 'scheduled').length > 0 && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-medium">
                    {posts.filter(post => post.status === 'scheduled').length} Scheduled Posts
                  </span>
                </div>
                <button
                  onClick={() => setFilter('scheduled')}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Next scheduled: {(() => {
                  const scheduledPosts = posts.filter(post => post.status === 'scheduled')
                  console.log('All scheduled posts:', scheduledPosts.map(p => ({ id: p.id, scheduledFor: p.scheduledFor, status: p.status })))
                  
                  // Always parse as UTC (assume scheduledFor is in ISO 8601 or add 'Z' if missing)
                  const parseUTC = (dateStr: string | undefined | null): Date | null => {
                    if (!dateStr) return null;
                    // If no timezone, add 'Z' to treat as UTC
                    return new Date(dateStr.match(/Z|[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                  };
                  const now = new Date();
                  const validScheduledPosts = scheduledPosts.filter(post => {
                    const parsed = parseUTC(post.scheduledFor);
                    const isFuture = parsed && parsed > now;
                    console.log(`Post ${post.id} scheduledFor:`, post.scheduledFor, 'Parsed:', parsed, 'Now:', now, 'Is future:', isFuture);
                    return isFuture;
                  });
                  console.log('Valid future scheduled posts:', validScheduledPosts.map(p => ({ id: p.id, scheduledFor: p.scheduledFor })))
                  
                  if (validScheduledPosts.length === 0) {
                    // Check if there are scheduled posts without dates
                    const postsWithoutDates = scheduledPosts.filter(post => !post.scheduledFor)
                    if (postsWithoutDates.length > 0) {
                      return `${postsWithoutDates.length} post(s) need scheduled date`
                    }
                    return 'None'
                  }
                  const nextPost = validScheduledPosts.sort((a, b) => {
                    const aDate = parseUTC(a.scheduledFor);
                    const bDate = parseUTC(b.scheduledFor);
                    if (!aDate || !bDate) return 0;
                    return aDate.getTime() - bDate.getTime();
                  })[0];
                  const nextDate = parseUTC(nextPost.scheduledFor);
                  if (!nextDate) return 'Invalid date';
                  const localString = nextDate.toLocaleDateString() + ' ' + nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
                  const vegasString = nextDate.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' }) + ' ' + nextDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles', timeZoneName: 'short' });
                  return `Local: ${localString} | Las Vegas: ${vegasString}`;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Category and Tag Management */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Categories */}
          <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-tech font-semibold text-white flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>Categories ({categories.length})</span>
              </h3>
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="text-neon-blue hover:text-white transition-colors"
              >
                {showCategoryManager ? 'Hide' : 'Manage'}
              </button>
            </div>
            
            {showCategoryManager && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    placeholder="New category name..."
                    className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-dark-metal/30 rounded-lg border border-gray-600/20"
                    >
                      {editingCategory === category.id ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                            className="flex-1 px-2 py-1 bg-dark-metal border border-gray-600 rounded text-white focus:border-neon-blue focus:outline-none text-sm"
                            autoFocus
                          />
                          <button
                            onClick={saveEditCategory}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="text-white font-medium">{category.name}</span>
                            <span className="text-gray-400 text-sm ml-2">({category.postCount} posts)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEditCategory(category)}
                              className="text-gray-400 hover:text-neon-blue transition-colors"
                              title="Edit category"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete category"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-tech font-semibold text-white flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Tags ({tags.length})</span>
              </h3>
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className="text-neon-blue hover:text-white transition-colors"
              >
                {showTagManager ? 'Hide' : 'Manage'}
              </button>
            </div>
            
            {showTagManager && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="New tag name..."
                    className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 bg-dark-metal/30 rounded-lg border border-gray-600/20"
                    >
                      {editingTag === tag.id ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEditTag()}
                            className="flex-1 px-2 py-1 bg-dark-metal border border-gray-600 rounded text-white focus:border-neon-blue focus:outline-none text-sm"
                            autoFocus
                          />
                          <button
                            onClick={saveEditTag}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditTag}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="text-white font-medium">{tag.name}</span>
                            <span className="text-gray-400 text-sm ml-2">({tag.postCount} posts)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEditTag(tag)}
                              className="text-gray-400 hover:text-neon-blue transition-colors"
                              title="Edit tag"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <button 
                onClick={handleCreatePost}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
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
                      <span className="text-gray-500">By {post.author.name}</span>
                      <span className="text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {post.status === 'scheduled' && post.scheduledFor 
                          ? `Scheduled: ${new Date(post.scheduledFor).toLocaleDateString()}`
                          : post.publishedAt 
                            ? new Date(post.publishedAt).toLocaleDateString() 
                            : 'Not published'
                        }
                      </span>
                      <span className={`font-medium ${getStatusColor(post.status)}`}>
                        {post.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                      title="View Post"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditPost(post)}
                      className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                      title="Edit Post"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Post"
                    >
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