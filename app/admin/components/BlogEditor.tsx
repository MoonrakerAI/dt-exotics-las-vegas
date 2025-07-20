'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Eye, 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar,
  Tag,
  FolderOpen,
  Search,
  Settings,
  Globe,
  Hash,
  EyeOff,
  Link
} from 'lucide-react'
import { BlogPost, BlogCategory, BlogTag } from '../../types/blog'

interface BlogEditorProps {
  post?: BlogPost
  onSave?: (post: BlogPost) => void
  onCancel?: () => void
  mode: 'create' | 'edit'
}

export default function BlogEditor({ post, onSave, onCancel, mode }: BlogEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [showSeoPanel, setShowSeoPanel] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    status: post?.status || 'draft' as const,
    featured: post?.featured || false,
    featuredImage: post?.featuredImage || '',
    categories: post?.categories || [],
    tags: post?.tags || [],
    author: post?.author || { name: 'Primary Admin', email: 'admin@dtexoticslv.com' },
    seo: {
      metaTitle: post?.seo.metaTitle || '',
      metaDescription: post?.seo.metaDescription || '',
      keywords: post?.seo.keywords || [],
      ogTitle: post?.seo.ogTitle || '',
      ogDescription: post?.seo.ogDescription || '',
      ogImage: post?.seo.ogImage || '',
      canonicalUrl: post?.seo.canonicalUrl || '',
      noIndex: post?.seo.noIndex || false,
      noFollow: post?.seo.noFollow || false
    }
  })

  // Available categories and tags
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (!formData.slug && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, formData.slug])

  // Auto-generate SEO fields from title and excerpt
  useEffect(() => {
    if (!formData.seo.metaTitle && formData.title) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, metaTitle: formData.title }
      }))
    }
    if (!formData.seo.ogTitle && formData.title) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, ogTitle: formData.title }
      }))
    }
    if (!formData.seo.metaDescription && formData.excerpt) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, metaDescription: formData.excerpt }
      }))
    }
    if (!formData.seo.ogDescription && formData.excerpt) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, ogDescription: formData.excerpt }
      }))
    }
  }, [formData.title, formData.excerpt])

  // Load categories and tags
  useEffect(() => {
    loadCategoriesAndTags()
  }, [])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/admin/blog' : `/api/admin/blog/${post?.id}`
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
        const savedPost = await response.json()
        if (onSave) {
          onSave(savedPost)
        } else {
          router.push('/admin/blog')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!post?.id || !confirm('Are you sure you want to delete this post?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        }
      })

      if (response.ok) {
        router.push('/admin/blog')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.trim()) return

    try {
      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        },
        body: JSON.stringify({ name: newCategory.trim() })
      })

      if (response.ok) {
        const category = await response.json()
        setCategories(prev => [...prev, category])
        setFormData(prev => ({
          ...prev,
          categories: [...prev.categories, category.name]
        }))
        setNewCategory('')
      }
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const addTag = async () => {
    if (!newTag.trim()) return

    try {
      const response = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dt-admin-token')}`
        },
        body: JSON.stringify({ name: newTag.trim() })
      })

      if (response.ok) {
        const tag = await response.json()
        setTags(prev => [...prev, tag])
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag.name]
        }))
        setNewTag('')
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }))
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addKeyword = () => {
    const keyword = prompt('Enter keyword:')
    if (keyword?.trim()) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, keyword.trim()]
        }
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter(k => k !== keyword)
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto bg-dark-metal border border-gray-600/30 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-dark-metal/50 p-6 border-b border-gray-600/30">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-tech font-bold text-white">
                  {mode === 'create' ? 'Create New Post' : 'Edit Post'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {mode === 'create' ? 'Write your new blog post' : 'Update your blog post'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    previewMode
                      ? 'bg-neon-blue text-black'
                      : 'bg-dark-gray text-gray-300 hover:text-white'
                  }`}
                >
                  {previewMode ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
                </button>
                
                <button
                  onClick={() => setShowSeoPanel(!showSeoPanel)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    showSeoPanel
                      ? 'bg-neon-blue text-black'
                      : 'bg-dark-gray text-gray-300 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>SEO</span>
                </button>
                
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
                  onClick={onCancel || (() => router.push('/admin/blog'))}
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

          <div className="flex">
            {/* Main Content */}
            {previewMode ? (
              <div className="flex-1">
                <div className="p-6">
                  {/* Preview Header */}
                  <div className="glass-panel bg-dark-metal/50 p-8 mb-8 border border-gray-600/30 rounded-2xl">
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                      <span>By {formData.author?.name || 'Primary Admin'}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                      {formData.categories.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{formData.categories.join(', ')}</span>
                        </>
                      )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-tech font-bold text-white mb-6">
                      {formData.title || 'Untitled Post'}
                    </h1>
                    
                    <p className="text-xl text-gray-300 mb-6">
                      {formData.excerpt || 'No excerpt provided'}
                    </p>

                    {/* Tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-neon-blue/10 text-neon-blue text-sm rounded-full border border-neon-blue/20"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl">
                    <div 
                      className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: (formData.content || 'No content yet')
                          .replace(/\n/g, '<br>')
                          .replace(/#{1,6}\s+(.+)/g, '<h1>$1</h1>')
                          .replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+)\*/g, '<em>$1</em>')
                          .replace(/`(.+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded">$1</code>')
                          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-4" />')
                          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-neon-blue hover:text-neon-blue/80 underline" target="_blank" rel="noopener noreferrer">$1</a>')
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex-1 ${showSeoPanel ? 'w-2/3' : 'w-full'}`}>
                <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-lg"
                    placeholder="Enter post title..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="post-url-slug"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    placeholder="Brief description of the post..."
                  />
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Featured Image URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button className="px-4 py-3 bg-dark-gray text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors">
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Categories and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categories *
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                          className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                          placeholder="Add new category..."
                        />
                        <button
                          onClick={addCategory}
                          className="px-3 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.categories.map((category, index) => (
                          <span
                            key={index}
                            className="flex items-center space-x-1 px-2 py-1 bg-neon-blue/10 text-neon-blue text-sm rounded-full border border-neon-blue/20"
                          >
                            <FolderOpen className="w-3 h-3" />
                            <span>{category}</span>
                            <button
                              onClick={() => removeCategory(category)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                          placeholder="Add new tag..."
                        />
                        <button
                          onClick={addTag}
                          className="px-3 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 text-green-300 text-sm rounded-full border border-green-500/20"
                          >
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Featured */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="w-4 h-4 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">Featured Post</span>
                    </label>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content *
                  </label>
                  <div className="mb-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const imageUrl = prompt('Enter image URL:')
                        if (imageUrl) {
                          const imageMarkdown = `\n![Image](${imageUrl})\n`
                          setFormData(prev => ({
                            ...prev,
                            content: prev.content + imageMarkdown
                          }))
                        }
                      }}
                      className="px-3 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Insert Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const linkText = prompt('Enter link text:')
                        const linkUrl = prompt('Enter link URL:')
                        if (linkText && linkUrl) {
                          const linkMarkdown = `[${linkText}](${linkUrl})`
                          setFormData(prev => ({
                            ...prev,
                            content: prev.content + linkMarkdown
                          }))
                        }
                      }}
                      className="px-3 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Link className="w-3 h-3" />
                      <span>Insert Link</span>
                    </button>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={20}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none font-mono text-sm"
                    placeholder="Write your blog post content here... (Markdown supported)

Quick formatting:
- **bold text**
- *italic text*
- [link text](url)
- ![image alt](image_url)
- # Heading 1
- ## Heading 2"
                  />
                </div>
              </div>
            </div>
            )}

            {/* SEO Panel */}
            {showSeoPanel && (
              <div className="w-1/3 border-l border-gray-600/30">
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-tech font-semibold text-white flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>SEO Settings</span>
                  </h3>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Title *
                    </label>
                    <input
                      type="text"
                      value={formData.seo.metaTitle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaTitle: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo.metaTitle.length}/60 characters
                    </p>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Description *
                    </label>
                    <textarea
                      value={formData.seo.metaDescription}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo.metaDescription.length}/160 characters
                    </p>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Keywords
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={addKeyword}
                          className="px-3 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors text-sm"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.seo.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/10 text-yellow-300 text-sm rounded-full border border-yellow-500/20"
                          >
                            <Hash className="w-3 h-3" />
                            <span>{keyword}</span>
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Open Graph Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Open Graph Title *
                    </label>
                    <input
                      type="text"
                      value={formData.seo.ogTitle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, ogTitle: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      maxLength={95}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo.ogTitle.length}/95 characters
                    </p>
                  </div>

                  {/* Open Graph Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Open Graph Description *
                    </label>
                    <textarea
                      value={formData.seo.ogDescription}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, ogDescription: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo.ogDescription.length}/200 characters
                    </p>
                  </div>

                  {/* Open Graph Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Open Graph Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.seo.ogImage}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, ogImage: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      placeholder="https://example.com/og-image.jpg"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      value={formData.seo.canonicalUrl}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, canonicalUrl: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                      placeholder="https://example.com/canonical-url"
                    />
                  </div>

                  {/* SEO Flags */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.seo.noIndex}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seo: { ...prev.seo, noIndex: e.target.checked }
                        }))}
                        className="w-4 h-4 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">No Index</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.seo.noFollow}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seo: { ...prev.seo, noFollow: e.target.checked }
                        }))}
                        className="w-4 h-4 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">No Follow</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 