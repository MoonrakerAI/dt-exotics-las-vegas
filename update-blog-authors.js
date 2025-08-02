#!/usr/bin/env node

/**
 * Update Blog Authors Script
 * 
 * This script calls the bulk update API endpoint to synchronize all existing
 * blog posts with the current admin profile information.
 */

const https = require('https');

// Configuration
const SITE_URL = 'https://dtexoticslv.com';
const API_ENDPOINT = '/api/admin/blog/update-author';

// You'll need to get your admin token from localStorage or the admin panel
// For now, we'll use a placeholder - you should replace this with your actual token
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

console.log('🔄 Updating blog authors with current admin profile...\n');

if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
  console.log('❌ Error: Please set your admin token in the script');
  console.log('   1. Log into the admin panel at https://dtexoticslv.com/admin');
  console.log('   2. Open browser developer tools (F12)');
  console.log('   3. Go to Application/Storage > Local Storage');
  console.log('   4. Find "dt-admin-token" and copy its value');
  console.log('   5. Replace YOUR_ADMIN_TOKEN_HERE in this script with that value');
  console.log('   6. Run this script again');
  process.exit(1);
}

const postData = JSON.stringify({});

const options = {
  hostname: 'dtexoticslv.com',
  port: 443,
  path: API_ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.success) {
        console.log('✅ Successfully updated blog authors!');
        console.log(`   📊 Updated ${response.updatedCount} blog posts`);
        console.log('   👤 Current admin profile:');
        console.log(`      Name: ${response.adminProfile.name}`);
        console.log(`      Email: ${response.adminProfile.email}`);
        if (response.adminProfile.avatar) {
          console.log(`      Avatar: ${response.adminProfile.avatar}`);
        }
        if (response.adminProfile.bio) {
          console.log(`      Bio: ${response.adminProfile.bio.substring(0, 100)}...`);
        }
        console.log('\n🎉 All blog posts now display your current admin profile!');
      } else {
        console.log('❌ Error updating blog authors:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}`);
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('   Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

req.write(postData);
req.end();
