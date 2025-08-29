import { kv } from '@vercel/kv';

async function checkKVData() {
  try {
    console.log('=== Checking KV Store Data ===');
    
    // 1. Check Cars
    console.log('\n=== Cars ===');
    const carIds = await kv.smembers('cars:all');
    console.log(`Total cars in set: ${carIds.length}`);
    
    const cars = await Promise.all(
      carIds.map(async (id: string) => {
        const car = await kv.get(`car:${id}`);
        return { id, exists: !!car };
      })
    );
    
    console.log('Car details:');
    cars.forEach(car => {
      console.log(`- ${car.id}: ${car.exists ? '✅ Found' : '❌ Missing'}`);
    });

    // 2. Check Invoices
    console.log('\n=== Invoices ===');
    const invoiceIds = await kv.smembers('invoices:all');
    console.log(`Total invoices in set: ${invoiceIds.length}`);
    
    const invoices = await Promise.all(
      invoiceIds.map(async (id: string) => {
        const invoice = await kv.get(`invoice:${id}`);
        return { id, exists: !!invoice };
      })
    );
    
    console.log('Invoice details:');
    invoices.forEach(invoice => {
      console.log(`- ${invoice.id}: ${invoice.exists ? '✅ Found' : '❌ Missing'}`);
    });

    // 3. Check Blogs
    console.log('\n=== Blogs ===');
    const postIds = await kv.smembers('blog:posts:all');
    console.log(`Total blog posts in set: ${postIds.length}`);
    
    const posts = await Promise.all(
      postIds.map(async (id: string) => {
        const post = await kv.get(`blog:post:${id}`);
        return { id, exists: !!post };
      })
    );
    
    console.log('Blog post details:');
    posts.forEach(post => {
      console.log(`- ${post.id}: ${post.exists ? '✅ Found' : '❌ Missing'}`);
    });

    // 4. Check all keys for patterns
    console.log('\n=== Key Patterns ===');
    const allKeys = await kv.keys('*');
    const keyPatterns = {
      cars: allKeys.filter((k: string) => k.startsWith('car:') && !k.includes('availability')),
      invoices: allKeys.filter((k: string) => k.startsWith('invoice:')),
      blogs: allKeys.filter((k: string) => k.startsWith('blog:')),
      other: allKeys.filter((k: string) => 
        !k.startsWith('car:') && 
        !k.startsWith('invoice:') && 
        !k.startsWith('blog:')
      )
    };

    console.log(`\nKey counts:`);
    console.log(`- Cars: ${keyPatterns.cars.length}`);
    console.log(`- Invoices: ${keyPatterns.invoices.length}`);
    console.log(`- Blogs: ${keyPatterns.blogs.length}`);
    console.log(`- Other: ${keyPatterns.other.length}`);

    if (keyPatterns.other.length > 0) {
      console.log('\nOther keys found:');
      keyPatterns.other.forEach((k: string) => console.log(`- ${k}`));
    }

  } catch (error) {
    console.error('Error checking KV data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkKVData();
