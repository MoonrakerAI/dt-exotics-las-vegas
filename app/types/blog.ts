export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: {
    name: string
    email: string
    avatar?: string
    bio?: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
    ogTitle: string
    ogDescription: string
    ogImage?: string
    canonicalUrl?: string
    noIndex: boolean
    noFollow: boolean
  }
  status: 'draft' | 'published' | 'archived' | 'scheduled'
  featured: boolean
  featuredImage?: string
  categories: string[]
  tags: string[]
  publishedAt?: string
  scheduledFor?: string
  createdAt: string
  updatedAt: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string
  postCount: number
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  postCount: number
}