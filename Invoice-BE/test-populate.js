const mongoose = require('mongoose');

async function testPopulation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    
    // Create mongoose models with proper schema refs
    const companySchema = new mongoose.Schema({}, { strict: false });
    const employeeSchema = new mongoose.Schema({
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
    }, { strict: false });
    
    const CompanyModel = mongoose.model('Company', companySchema, 'companies');
    const EmployeeModel = mongoose.model('Employee', employeeSchema, 'employees');

    // Get user
    const user = await db.collection('users').findOne({ email: 'test@invoice.com' });
    const userId = user._id;

    console.log('\n📋 Testing employee query WITH populate:');
    const employees = await EmployeeModel
      .find({ deletedAt: null, userId: userId })
      .populate('companyId')
      .limit(2)
      .lean();

    employees.forEach(emp => {
      console.log('\n--- Employee ---');
      console.log('Name:', emp.firstName, emp.lastName);
      console.log('CNSS Applicable:', emp.cnssApplicable);
      console.log('Monthly Salary:', emp.monthlyNetSalary);
      console.log('CNSS Rate:', emp.cnssRatePercent, '%');
      console.log('Company (populated):', emp.companyId ? {
        _id: emp.companyId._id,
        name: emp.companyId.companyname,
        type: emp.companyId.companyType
      } : 'NOT POPULATED');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPopulation();
