const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Find the test user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    
    if (user) {
      console.log('✓ User found');
      console.log('Testing password: password123');
      
      // Test the password
      const isMatch = await bcryptjs.compare('password123', user.password);
      console.log('Password match result:', isMatch);
      
      if (isMatch) {
        console.log('✓ Password is correct!');
      } else {
        console.log('✗ Password does NOT match!');
        console.log('Hash in DB:', user.password);
        
        // Generate a new hash to compare
        const newHash = await bcryptjs.hash('password123', 10);
        console.log('New hash:', newHash);
        const newMatch = await bcryptjs.compare('password123', newHash);
        console.log('New hash matches password123:', newMatch);
      }
    } else {
      console.log('✗ User NOT found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPassword();
