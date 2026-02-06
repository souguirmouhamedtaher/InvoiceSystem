// Quick test to verify the payroll summary endpoint returns correct data
const mongoose = require('mongoose');

async function testBackendLogic() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection;
    const ObjectId = mongoose.Types.ObjectId;
    
    // Get user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    const userId = user._id;
    
    // Simulate what the backend endpoint does
    const month = '2026-02';
    const userObjectId = new ObjectId(userId);
    
    console.log('📊 Simulating GET /employee/payroll/summary?month=2026-02\n');
    console.log('Query parameters:');
    console.log('  - month:', month);
    console.log('  - userId (from JWT):', userId.toString());
    console.log('  - userId (converted):', userObjectId.toString());
    
    // Query salaries
    const salaryQuery = { deletedAt: null, month: month, userId: userObjectId };
    const salaries = await db.collection('salaries').find(salaryQuery).toArray();
    const totalSalaryAmount = salaries.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
    
    // Query CNSS
    const cnssQuery = { deletedAt: null, month: month, userId: userObjectId };
    const cnssPayments = await db.collection('cnsspayments').find(cnssQuery).toArray();
    const totalCnssAmount = cnssPayments.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    const response = {
      month: month,
      totalSalaryAmount,
      totalCnssAmount,
      salaryCount: salaries.length,
      cnssCount: cnssPayments.length
    };
    
    console.log('\n✅ Expected API Response:');
    console.log(JSON.stringify(response, null, 2));
    
    await mongoose.connection.close();
    
    if (totalSalaryAmount === 0 && totalCnssAmount === 0) {
      console.log('\n❌ ERROR: Totals are 0! Check if ObjectId conversion is working in backend.');
    } else {
      console.log('\n✅ SUCCESS: Backend should return these values.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBackendLogic();
