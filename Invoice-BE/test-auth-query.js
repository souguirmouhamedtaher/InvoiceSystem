const mongoose = require('mongoose');

async function testAuthQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    const email = 'test@invoice.com'.toLowerCase();
    console.log('Querying for email:', email);
    
    // Test the exact query that findByAttribute would use
    const query = { email: email, deletedAt: null };
    console.log('Query:', JSON.stringify(query));
    
    const user = await db.collection('users').findOne(query);
    
    if (user) {
      console.log('✓ User FOUND with this query');
      console.log('  Email:', user.email);
      console.log('  _id:', user._id);
    } else {
      console.log('✗ User NOT found with this query');
      
      // Try without deletedAt filter
      const userWithoutFilter = await db.collection('users').findOne({ email: email });
      if (userWithoutFilter) {
        console.log('✓ User found WITHOUT deletedAt filter:');
        console.log('  deletedAt value:', userWithoutFilter.deletedAt, 'Type:', typeof userWithoutFilter.deletedAt);
      }
      
      // Show all users
      const allUsers = await db.collection('users').find({}).toArray();
      console.log(`\nAll users in DB (${allUsers.length}):`);
      allUsers.forEach(u => {
        console.log(`  Email: ${u.email}, deletedAt: ${u.deletedAt} (${typeof u.deletedAt})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAuthQuery();
