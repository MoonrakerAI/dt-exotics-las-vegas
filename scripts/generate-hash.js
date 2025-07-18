const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'AI2025!';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHash();