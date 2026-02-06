const mongoose = require('mongoose');

async function testEmployeeQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Get user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    const userId = user._id;
    console.log('User ID:', userId.toString());

    // Get a company ID to filter by
    const companies = await db.collection('companies').find({ userId }).toArray();
    const company1Id = companies[0]._id;
    console.log('\nCompany 1 ID:', company1Id.toString());
    console.log('Company 1 Name:', companies[0].companyname);

    // Test query WITHOUT companyId filter (should return all 6 employees)
    console.log('\n\n🔍 Query 1: All employees for user (no companyId filter)');
    const allEmployees = await db.collection('employees').find({
      deletedAt: null,
      userId: userId
    }).toArray();
    console.log('Found:', allEmployees.length, 'employees');

    // Test query WITH companyId filter as ObjectId (should return 4 employees)
    console.log('\n\n🔍 Query 2: Employees filtered by companyId (as ObjectId)');
    const filteredEmployees = await db.collection('employees').find({
      deletedAt: null,
      userId: userId,
      companyId: company1Id
    }).toArray();
    console.log('Found:', filteredEmployees.length, 'employees');
    filteredEmployees.forEach(emp => {
      console.log(`  - ${emp.firstName} ${emp.lastName} (CNSS: ${emp.cnssApplicable})`);
    });

    // Test query WITH companyId filter as STRING (should return 0 - this is the bug!)
    console.log('\n\n🔍 Query 3: Employees filtered by companyId (as string - BUG)');
    const stringFilteredEmployees = await db.collection('employees').find({
      deletedAt: null,
      userId: userId,
      companyId: company1Id.toString()
    }).toArray();
    console.log('Found:', stringFilteredEmployees.length, 'employees (WRONG - this is what was happening before fix)');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEmployeeQuery();
