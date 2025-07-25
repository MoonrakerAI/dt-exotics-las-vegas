import { notFound } from 'next/navigation'
import blogDB from '../../lib/blog-database'
import { Metadata } from 'next'

function parseMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-3xl font-tech font-bold text-white mb-6 mt-8">$1</h1>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-2xl font-tech font-bold text-white mb-4 mt-6">$1</h2>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-xl font-tech font-semibold text-white mb-3 mt-5">$1</h3>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4 class="text-lg font-tech font-semibold text-white mb-2 mt-4">$1</h4>')
    .replace(/^#{5}\s+(.+)$/gm, '<h5 class="text-base font-tech font-semibold text-white mb-2 mt-3">$1</h5>')
    .replace(/^#{6}\s+(.+)$/gm, '<h6 class="text-sm font-tech font-semibold text-white mb-2 mt-3">$1</h6>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Code
    .replace(/`(.+?)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-4" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-neon-blue hover:text-neon-blue/80 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Convert line breaks to paragraphs
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.trim().startsWith('<h')) {
        return paragraph.trim()
      }
      return `<p class="text-base text-gray-300 leading-relaxed mb-4">${paragraph.trim().replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogDB.getPostBySlug(slug)
  
  if (!post || post.status !== 'published') {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    }
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    openGraph: {
      title: post.seo.ogTitle,
      description: post.seo.ogDescription,
      images: post.seo.ogImage ? [post.seo.ogImage] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.ogTitle,
      description: post.seo.ogDescription,
      images: post.seo.ogImage ? [post.seo.ogImage] : []
    },
    robots: {
      index: !post.seo.noIndex,
      follow: !post.seo.noFollow
    },
    alternates: post.seo.canonicalUrl ? {
      canonical: post.seo.canonicalUrl
    } : undefined
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await blogDB.getPostBySlug(slug)
  
  if (!post || post.status !== 'published') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      {/* Hero Section */}
      {post.featuredImage && (
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      <div className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="glass-panel bg-dark-metal/50 p-8 mb-8 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
              <span>By {post.author.name}</span>
              <span>•</span>
              <span>{new Date(post.publishedAt!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              {post.categories.length > 0 && (
                <>
                  <span>•</span>
                  <span>{post.categories.join(', ')}</span>
                </>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-tech font-bold text-white mb-6">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-300 mb-6">
              {post.excerpt}
            </p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
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

          {/* Post Content */}
          <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl mb-8">
            <div 
              className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: parseMarkdown(post.content)
              }}
            />
          </div>

          {/* Author Info */}
          <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center">
                <span className="text-neon-blue font-bold text-lg">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{post.author.name}</h3>
                <p className="text-gray-400 text-sm">Author</p>
              </div>
            </div>
          </div>

          {/* Back to Blog */}
          <div className="text-center">
            <a
              href="/blog"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-all duration-300"
            >
              <span>← Back to Blog</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 