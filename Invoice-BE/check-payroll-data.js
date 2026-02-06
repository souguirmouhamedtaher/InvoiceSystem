const mongoose = require('mongoose');

async function checkPayrollData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const month = '2026-02';
    
    // Find the test user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    console.log('User ID:', user?._id);
    
    if (user) {
      console.log('\n=== Checking Salaries for month:', month, '===');
      const salaries = await db.collection('salaries').find({ 
        month: month,
        userId: user._id 
      }).toArray();
      console.log(`Found ${salaries.length} salary records`);
      salaries.forEach(s => {
        console.log(`  - Employee: ${s.employeeId}, Amount: ${s.netAmount}, Month: ${s.month}`);
      });

      console.log('\n=== Checking CNSS Payments for month:', month, '===');
      const cnssPayments = await db.collection('cnsspayments').find({ 
        month: month,
        userId: user._id 
      }).toArray();
      console.log(`Found ${cnssPayments.length} CNSS records`);
      cnssPayments.forEach(c => {
        console.log(`  - Employee: ${c.employeeId}, Amount: ${c.amount}, Month: ${c.month}`);
      });

      // Check all salaries regardless of month
      console.log('\n=== ALL Salary Records ===');
      const allSalaries = await db.collection('salaries').find({ 
        userId: user._id 
      }).toArray();
      console.log(`Found ${allSalaries.length} total salary records`);
      allSalaries.forEach(s => {
        console.log(`  - Month: ${s.month}, Amount: ${s.netAmount}, deletedAt: ${s.deletedAt}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPayrollData();
