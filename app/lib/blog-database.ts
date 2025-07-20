// Blog database using Vercel KV (Redis)
// Handles blog posts, categories, and tags with persistent storage

import { kv } from '@vercel/kv';
import { BlogPost, BlogCategory, BlogTag } from '../types/blog';

class BlogDatabase {
  // Key prefixes for organization
  private readonly POST_PREFIX = 'blog:post:';
  private readonly CATEGORY_PREFIX = 'blog:category:';
  private readonly TAG_PREFIX = 'blog:tag:';
  private readonly POST_LIST_KEY = 'blog:posts:all';
  private readonly CATEGORY_LIST_KEY = 'blog:categories:all';
  private readonly TAG_LIST_KEY = 'blog:tags:all';
  private readonly POSTS_BY_STATUS_PREFIX = 'blog:posts:status:';
  private readonly POSTS_BY_CATEGORY_PREFIX = 'blog:posts:category:';
  private readonly POSTS_BY_TAG_PREFIX = 'blog:posts:tag:';

  // Blog Post Operations
  async createPost(post: BlogPost): Promise<BlogPost> {
    // Store the post
    await kv.set(this.POST_PREFIX + post.id, post);
    
    // Add to post list for easy retrieval
    await kv.sadd(this.POST_LIST_KEY, post.id);
    
    // Index by status
    await kv.sadd(this.POSTS_BY_STATUS_PREFIX + post.status, post.id);
    
    // Index by categories
    for (const category of post.categories) {
      await kv.sadd(this.POSTS_BY_CATEGORY_PREFIX + category, post.id);
    }
    
    // Index by tags
    for (const tag of post.tags) {
      await kv.sadd(this.POSTS_BY_TAG_PREFIX + tag, post.id);
    }
    
    // Update category and tag counts
    await this.updateCategoryCounts();
    await this.updateTagCounts();
    
    return post;
  }

  async getPost(postId: string): Promise<BlogPost | null> {
    const post = await kv.get<BlogPost>(this.POST_PREFIX + postId);
    return post || null;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const allPosts = await this.getAllPosts();
    return allPosts.find(post => post.slug === slug) || null;
  }

  async updatePost(postId: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const existing = await this.getPost(postId);
    if (!existing) return null;

    const updatedPost: BlogPost = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Remove from old status index if status changed
    if (updates.status && updates.status !== existing.status) {
      await kv.srem(this.POSTS_BY_STATUS_PREFIX + existing.status, postId);
      await kv.sadd(this.POSTS_BY_STATUS_PREFIX + updates.status, postId);
    }

    // Remove from old category indexes if categories changed
    if (updates.categories) {
      for (const category of existing.categories) {
        await kv.srem(this.POSTS_BY_CATEGORY_PREFIX + category, postId);
      }
      for (const category of updates.categories) {
        await kv.sadd(this.POSTS_BY_CATEGORY_PREFIX + category, postId);
      }
    }

    // Remove from old tag indexes if tags changed
    if (updates.tags) {
      for (const tag of existing.tags) {
        await kv.srem(this.POSTS_BY_TAG_PREFIX + tag, postId);
      }
      for (const tag of updates.tags) {
        await kv.sadd(this.POSTS_BY_TAG_PREFIX + tag, postId);
      }
    }

    // Store updated post
    await kv.set(this.POST_PREFIX + postId, updatedPost);

    // Update category and tag counts
    await this.updateCategoryCounts();
    await this.updateTagCounts();

    return updatedPost;
  }

  async deletePost(postId: string): Promise<boolean> {
    const post = await this.getPost(postId);
    if (!post) return false;

    // Remove from all indexes
    await kv.del(this.POST_PREFIX + postId);
    await kv.srem(this.POST_LIST_KEY, postId);
    await kv.srem(this.POSTS_BY_STATUS_PREFIX + post.status, postId);
    
    for (const category of post.categories) {
      await kv.srem(this.POSTS_BY_CATEGORY_PREFIX + category, postId);
    }
    
    for (const tag of post.tags) {
      await kv.srem(this.POSTS_BY_TAG_PREFIX + tag, postId);
    }

    // Update category and tag counts
    await this.updateCategoryCounts();
    await this.updateTagCounts();

    return true;
  }

  async getAllPosts(): Promise<BlogPost[]> {
    const postIds = await kv.smembers(this.POST_LIST_KEY);
    
    if (postIds.length === 0) return [];

    const posts: BlogPost[] = [];
    for (const id of postIds) {
      const post = await this.getPost(id as string);
      if (post) posts.push(post);
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPostsByStatus(status: 'draft' | 'published' | 'archived'): Promise<BlogPost[]> {
    const postIds = await kv.smembers(this.POSTS_BY_STATUS_PREFIX + status);
    
    if (postIds.length === 0) return [];

    const posts: BlogPost[] = [];
    for (const id of postIds) {
      const post = await this.getPost(id as string);
      if (post) posts.push(post);
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPublishedPosts(): Promise<BlogPost[]> {
    return this.getPostsByStatus('published');
  }

  async getPostsByCategory(category: string): Promise<BlogPost[]> {
    const postIds = await kv.smembers(this.POSTS_BY_CATEGORY_PREFIX + category);
    
    if (postIds.length === 0) return [];

    const posts: BlogPost[] = [];
    for (const id of postIds) {
      const post = await this.getPost(id as string);
      if (post && post.status === 'published') posts.push(post);
    }

    return posts.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  async getPostsByTag(tag: string): Promise<BlogPost[]> {
    const postIds = await kv.smembers(this.POSTS_BY_TAG_PREFIX + tag);
    
    if (postIds.length === 0) return [];

    const posts: BlogPost[] = [];
    for (const id of postIds) {
      const post = await this.getPost(id as string);
      if (post && post.status === 'published') posts.push(post);
    }

    return posts.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  // Category Operations
  async createCategory(category: BlogCategory): Promise<BlogCategory> {
    await kv.set(this.CATEGORY_PREFIX + category.id, category);
    await kv.sadd(this.CATEGORY_LIST_KEY, category.id);
    return category;
  }

  async getCategory(categoryId: string): Promise<BlogCategory | null> {
    const category = await kv.get<BlogCategory>(this.CATEGORY_PREFIX + categoryId);
    return category || null;
  }

  async getAllCategories(): Promise<BlogCategory[]> {
    const categoryIds = await kv.smembers(this.CATEGORY_LIST_KEY);
    
    if (categoryIds.length === 0) return [];

    const categories: BlogCategory[] = [];
    for (const id of categoryIds) {
      const category = await this.getCategory(id as string);
      if (category) categories.push(category);
    }

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateCategory(categoryId: string, updates: Partial<BlogCategory>): Promise<BlogCategory | null> {
    const existing = await this.getCategory(categoryId);
    if (!existing) return null;

    const updatedCategory: BlogCategory = {
      ...existing,
      ...updates
    };

    await kv.set(this.CATEGORY_PREFIX + categoryId, updatedCategory);

    // If the name changed, update all posts that use this category
    if (updates.name && updates.name !== existing.name) {
      await this.updatePostsWithCategory(existing.name, updates.name);
    }

    return updatedCategory;
  }

  private async updatePostsWithCategory(oldName: string, newName: string): Promise<void> {
    const allPosts = await this.getAllPosts();
    
    for (const post of allPosts) {
      if (post.categories.includes(oldName)) {
        const updatedCategories = post.categories.map(cat => 
          cat === oldName ? newName : cat
        );
        
        await this.updatePost(post.id, { categories: updatedCategories });
      }
    }
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const category = await this.getCategory(categoryId);
    if (!category) return false;

    await kv.del(this.CATEGORY_PREFIX + categoryId);
    await kv.srem(this.CATEGORY_LIST_KEY, categoryId);
    return true;
  }

  // Tag Operations
  async createTag(tag: BlogTag): Promise<BlogTag> {
    await kv.set(this.TAG_PREFIX + tag.id, tag);
    await kv.sadd(this.TAG_LIST_KEY, tag.id);
    return tag;
  }

  async getTag(tagId: string): Promise<BlogTag | null> {
    const tag = await kv.get<BlogTag>(this.TAG_PREFIX + tagId);
    return tag || null;
  }

  async getAllTags(): Promise<BlogTag[]> {
    const tagIds = await kv.smembers(this.TAG_LIST_KEY);
    
    if (tagIds.length === 0) return [];

    const tags: BlogTag[] = [];
    for (const id of tagIds) {
      const tag = await this.getTag(id as string);
      if (tag) tags.push(tag);
    }

    return tags.sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateTag(tagId: string, updates: Partial<BlogTag>): Promise<BlogTag | null> {
    const existing = await this.getTag(tagId);
    if (!existing) return null;

    const updatedTag: BlogTag = {
      ...existing,
      ...updates
    };

    await kv.set(this.TAG_PREFIX + tagId, updatedTag);

    // If the name changed, update all posts that use this tag
    if (updates.name && updates.name !== existing.name) {
      await this.updatePostsWithTag(existing.name, updates.name);
    }

    return updatedTag;
  }

  private async updatePostsWithTag(oldName: string, newName: string): Promise<void> {
    const allPosts = await this.getAllPosts();
    
    for (const post of allPosts) {
      if (post.tags.includes(oldName)) {
        const updatedTags = post.tags.map(tag => 
          tag === oldName ? newName : tag
        );
        
        await this.updatePost(post.id, { tags: updatedTags });
      }
    }
  }

  async deleteTag(tagId: string): Promise<boolean> {
    const tag = await this.getTag(tagId);
    if (!tag) return false;

    await kv.del(this.TAG_PREFIX + tagId);
    await kv.srem(this.TAG_LIST_KEY, tagId);
    return true;
  }

  // Utility Methods
  private async updateCategoryCounts(): Promise<void> {
    const categories = await this.getAllCategories();
    
    for (const category of categories) {
      const postIds = await kv.smembers(this.POSTS_BY_CATEGORY_PREFIX + category.slug);
      const publishedPosts = [];
      
      for (const postId of postIds) {
        const post = await this.getPost(postId as string);
        if (post && post.status === 'published') {
          publishedPosts.push(post);
        }
      }
      
      await this.updateCategory(category.id, { postCount: publishedPosts.length });
    }
  }

  private async updateTagCounts(): Promise<void> {
    const tags = await this.getAllTags();
    
    for (const tag of tags) {
      const postIds = await kv.smembers(this.POSTS_BY_TAG_PREFIX + tag.slug);
      const publishedPosts = [];
      
      for (const postId of postIds) {
        const post = await this.getPost(postId as string);
        if (post && post.status === 'published') {
          publishedPosts.push(post);
        }
      }
      
      await this.updateTag(tag.id, { postCount: publishedPosts.length });
    }
  }

  // Get database stats
  async getStats(): Promise<{
    totalPosts: number;
    postsByStatus: Record<string, number>;
    totalCategories: number;
    totalTags: number;
  }> {
    const allPosts = await this.getAllPosts();
    const categories = await this.getAllCategories();
    const tags = await this.getAllTags();
    
    const postsByStatus: Record<string, number> = {};
    allPosts.forEach(post => {
      postsByStatus[post.status] = (postsByStatus[post.status] || 0) + 1;
    });

    return {
      totalPosts: allPosts.length,
      postsByStatus,
      totalCategories: categories.length,
      totalTags: tags.length
    };
  }

  // Search posts
  async searchPosts(query: string): Promise<BlogPost[]> {
    const allPosts = await this.getAllPosts();
    const searchTerm = query.toLowerCase();
    
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.author.name.toLowerCase().includes(searchTerm) ||
      post.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
}

// Create singleton instance
const blogDB = new BlogDatabase();

export default blogDB; 