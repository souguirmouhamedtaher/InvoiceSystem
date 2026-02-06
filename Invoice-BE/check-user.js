const mongoose = require('mongoose');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoice-app');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Find the test user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    
    if (user) {
      console.log('✓ User found in database:');
      console.log('  Email:', user.email);
      console.log('  Password hash:', user.password ? user.password.substring(0, 20) + '...' : 'MISSING');
      console.log('  Role:', user.role);
      console.log('  isDeleted:', user.isDeleted);
      console.log('  deletedAt:', user.deletedAt);
      console.log('  _id:', user._id);
    } else {
      console.log('✗ User NOT found in database with email: test@invoice.com');
      
      // Check all users
      const allUsers = await db.collection('users').find({}).toArray();
      console.log(`\nFound ${allUsers.length} total users in database:`);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (deletedAt: ${u.deletedAt})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
