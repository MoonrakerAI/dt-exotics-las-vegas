'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'
import { BlogPost, BlogCategory, BlogTag } from '../types/blog'

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlogData()
  }, [])

  const loadBlogData = async () => {
    try {
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/blog'),
        fetch('/api/blog/categories'),
        fetch('/api/blog/tags')
      ])

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts || postsData)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }
    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (post.status !== 'published') return false
    
    const categoryMatch = selectedCategory === 'all' || post.categories.includes(selectedCategory)
    const tagMatch = selectedTag === 'all' || post.tags.includes(selectedTag)
    
    return categoryMatch && tagMatch
  })

  const featuredPost = posts.find(post => post.featured && post.status === 'published')

  return (
    <main className="relative min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 bg-gradient-to-br from-dark-gray via-dark-metal to-dark-gray">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-tech font-black mb-6">
            <span className="text-white">LUXURY</span>{' '}
            <span className="neon-text">INSIGHTS</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the latest in luxury automotive experiences, industry insights, 
            and exclusive content from the world of premium transportation.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mb-4"></div>
            <p className="text-gray-300 text-lg">Loading blog posts...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-12">
                <h2 className="text-2xl font-tech font-bold text-white mb-6">Featured Article</h2>
                <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl hover:border-neon-blue/50 transition-all duration-500">
                  {featuredPost.featuredImage && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <Image
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        width={800}
                        height={400}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.publishedAt!).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author.name}
                    </div>
                  </div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-4">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 text-neon-blue hover:text-white transition-colors duration-300"
                  >
                    Read Full Article
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* All Posts */}
            <div className="mb-8">
              <h2 className="text-2xl font-tech font-bold text-white mb-6">Latest Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPosts
                  .filter(post => !post.featured)
                  .map((post) => (
                  <article
                    key={post.id}
                    className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-lg hover:border-neon-blue/50 transition-all duration-500"
                  >
                    {post.featuredImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={400}
                          height={200}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt!).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author.name}
                      </div>
                    </div>
                    <h3 className="text-lg font-tech font-bold text-white mb-3">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-neon-blue/10 text-neon-blue text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-neon-blue hover:text-white transition-colors duration-300 text-sm"
                      >
                        Read More →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Categories Filter */}
              <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-lg">
                <h3 className="text-lg font-tech font-bold text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
                      selectedCategory === 'all'
                        ? 'bg-neon-blue text-black'
                        : 'text-gray-300 hover:text-white hover:bg-dark-gray/50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
                        selectedCategory === category.name
                          ? 'bg-neon-blue text-black'
                          : 'text-gray-300 hover:text-white hover:bg-dark-gray/50'
                      }`}
                    >
                      {category.name} ({category.postCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-lg">
                <h3 className="text-lg font-tech font-bold text-white mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      selectedTag === 'all'
                        ? 'bg-neon-blue text-black'
                        : 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    All
                  </button>
                  {tags.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(tag.name)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                        selectedTag === tag.name
                          ? 'bg-neon-blue text-black'
                          : 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact CTA */}
              <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-lg">
                <h3 className="text-lg font-tech font-bold text-white mb-3">Ready to Experience Luxury?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Get behind the wheel of your dream supercar today.
                </p>
                <a
                  href="sms:+17025180924"
                  className="btn-primary w-full inline-block text-center"
                >
                  Text Us Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      <Footer />
    </main>
  )
}