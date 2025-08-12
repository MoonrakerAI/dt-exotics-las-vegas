const crypto = require('crypto');

// Test password
const password = 'AI2025!';

// Generate hash the same way the auth system does
const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

console.log('=== Password Hash Test ===');
console.log('Password:', password);
console.log('Generated hash:', hashedPassword);
console.log('Expected hash: 0d65cee9cd5f96edb982ec3d867345b63029a6172d78e941282d6701a4a59db6');
console.log('Hashes match:', hashedPassword === '0d65cee9cd5f96edb982ec3d867345b63029a6172d78e941282d6701a4a59db6');
console.log('Hash length:', hashedPassword.length);

// Test with different approaches
console.log('\n=== Testing different approaches ===');

// Method 1: Direct string
const hash1 = crypto.createHash('sha256').update('AI2025!').digest('hex');
console.log('Method 1 (direct):', hash1);

// Method 2: Buffer
const hash2 = crypto.createHash('sha256').update(Buffer.from('AI2025!', 'utf8')).digest('hex');
console.log('Method 2 (buffer):', hash2);

// Method 3: Explicit encoding
const hash3 = crypto.createHash('sha256').update('AI2025!', 'utf8').digest('hex');
console.log('Method 3 (utf8):', hash3);

console.log('\nAll methods match:', hash1 === hash2 && hash2 === hash3);
