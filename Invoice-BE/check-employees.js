const mongoose = require('mongoose');

async function checkEmployees() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Get user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    console.log('\n📌 User ID:', user._id.toString());

    // Get all employees
    const employees = await db.collection('employees').find({}).toArray();
    console.log('\n👥 Total employees in DB:', employees.length);
    
    employees.forEach((emp, i) => {
      console.log(`\n--- Employee ${i + 1} ---`);
      console.log('_id:', emp._id);
      console.log('userId:', emp.userId);
      console.log('companyId:', emp.companyId);
      console.log('firstName:', emp.firstName);
      console.log('cnssApplicable:', emp.cnssApplicable);
      console.log('monthlyNetSalary:', emp.monthlyNetSalary);
      console.log('deletedAt:', emp.deletedAt);
    });

    // Check companies
    const companies = await db.collection('companies').find({}).toArray();
    console.log('\n\n🏢 Total companies in DB:', companies.length);
    companies.forEach((comp, i) => {
      console.log(`\n--- Company ${i + 1} ---`);
      console.log('_id:', comp._id);
      console.log('userId:', comp.userId);
      console.log('companyname:', comp.companyname);
      console.log('companyType:', comp.companyType);
    });

    // Test query with userId filter
    console.log('\n\n🔍 Testing query with userId filter...');
    const filteredEmployees = await db.collection('employees').find({
      deletedAt: null,
      userId: user._id
    }).toArray();
    console.log('Employees found with userId filter:', filteredEmployees.length);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmployees();
