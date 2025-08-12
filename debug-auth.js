// Debug script to check auth logic (simulating production environment)
// Since we're debugging production, we'll simulate the environment variables

console.log('=== Simulating Production Environment ===');
// These would be the values from Vercel environment variables
const ADMIN_EMAIL_3 = 'support@moonraker.ai';
const ADMIN_PASSWORD_HASH_3 = '0d65cee9cd5f96edb982ec3d867345b63029a6172d78e941282d6701a4a59db6';

console.log('ADMIN_EMAIL_3:', ADMIN_EMAIL_3);
console.log('ADMIN_PASSWORD_HASH_3:', ADMIN_PASSWORD_HASH_3 ? 'SET' : 'NOT SET');

console.log('\n=== Admin Users Configuration ===');
const ADMIN_USERS = [
  {
    id: "1",
    email: "admin@dtexoticslv.com", // Default fallback
    name: "Primary Admin",
    role: "admin"
  },
  {
    id: "2", 
    email: "manager@dtexoticslv.com", // Default fallback
    name: "Manager",
    role: "admin"
  },
  {
    id: "3",
    email: ADMIN_EMAIL_3 || "support@dtexoticslv.com", 
    name: "Support Admin",
    role: "admin"
  }
];

const ADMIN_PASSWORD_HASHES = [
  null, // No hash for user 1
  null, // No hash for user 2
  ADMIN_PASSWORD_HASH_3 // Hash for user 3
];

ADMIN_USERS.forEach((user, index) => {
  console.log(`User ${index + 1}:`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Has Password Hash: ${ADMIN_PASSWORD_HASHES[index] ? 'YES' : 'NO'}`);
  if (ADMIN_PASSWORD_HASHES[index]) {
    console.log(`  Hash Length: ${ADMIN_PASSWORD_HASHES[index].length}`);
  }
});

console.log('\n=== Testing Login Logic ===');
const testEmail = 'support@moonraker.ai';
const testPassword = 'AI2025!';

// Find the admin user by email
const adminUser = ADMIN_USERS.find(user => user.email.toLowerCase() === testEmail.toLowerCase());
console.log('Found admin user:', adminUser ? 'YES' : 'NO');

if (adminUser) {
  // Get the corresponding password hash
  const userIndex = ADMIN_USERS.findIndex(user => user.email.toLowerCase() === testEmail.toLowerCase());
  const passwordHash = ADMIN_PASSWORD_HASHES[userIndex];
  
  console.log('User index:', userIndex);
  console.log('Password hash from env:', passwordHash ? 'FOUND' : 'NOT FOUND');
  
  if (passwordHash) {
    // Hash the provided password and compare
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(testPassword).digest('hex');
    
    console.log('Generated hash:', hashedPassword);
    console.log('Stored hash:', passwordHash);
    console.log('Hashes match:', hashedPassword === passwordHash);
  }
}
