const mongoose = require('mongoose');

async function testPayrollQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const ObjectId = mongoose.Types.ObjectId;
    
    // Get user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    const userId = user._id;
    console.log('User ID:', userId.toString());

    const month = '2026-02';
    const userObjectId = new ObjectId(userId);
    
    console.log('\n🔍 Testing Salary Query:');
    const salaryQuery = { deletedAt: null, month: month, userId: userObjectId };
    console.log('Query:', JSON.stringify({
      deletedAt: null,
      month: month,
      userId: userId.toString()
    }));
    
    const salaries = await db.collection('salaries').find(salaryQuery).toArray();
    console.log('Salaries found:', salaries.length);
    
    if (salaries.length > 0) {
      const totalSalary = salaries.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
      console.log('Total Salary Amount:', totalSalary, 'TND');
      console.log('Sample salary:', {
        netAmount: salaries[0].netAmount,
        month: salaries[0].month,
        userId: salaries[0].userId
      });
    }

    console.log('\n🔍 Testing CNSS Query:');
    const cnssQuery = { deletedAt: null, month: month, userId: userObjectId };
    const cnssPayments = await db.collection('cnsspayments').find(cnssQuery).toArray();
    console.log('CNSS Payments found:', cnssPayments.length);
    
    if (cnssPayments.length > 0) {
      const totalCnss = cnssPayments.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      console.log('Total CNSS Amount:', totalCnss, 'TND');
      console.log('Sample CNSS:', {
        amount: cnssPayments[0].amount,
        month: cnssPayments[0].month,
        userId: cnssPayments[0].userId
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPayrollQuery();
