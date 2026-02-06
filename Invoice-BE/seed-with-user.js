const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoiceapp');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const ObjectId = mongoose.Types.ObjectId;

    // Clear existing data
    await db.dropCollection('companies').catch(() => {});
    await db.dropCollection('employees').catch(() => {});
    await db.dropCollection('salaries').catch(() => {});
    await db.dropCollection('cnsspayments').catch(() => {});
    await db.dropCollection('tvapayments').catch(() => {});
    await db.dropCollection('taxsettings').catch(() => {});
    await db.dropCollection('users').catch(() => {});

    // Create Test User
    const userId = new ObjectId();
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.collection('users').insertOne({
      _id: userId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@invoice.com',
      password: hashedPassword,
      role: ['user'],
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✓ Test user created: test@invoice.com / password123');

    const company1Id = new ObjectId();
    const company2Id = new ObjectId();

    // Insert Companies (with userId)
    await db.collection('companies').insertMany([
      {
        _id: company1Id,
        userId: userId,
        companyname: 'STARTUP TUNISIA',
        companyType: 'mycompany',
        email: 'contact@startup.tn',
        address: 'Tunis, Rue de la Paz',
        phones: ['+21698765432'],
        city: 'Tunis',
        country: 'Tunisia',
        notes: 'Tech startup',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null
      },
      {
        _id: company2Id,
        userId: userId,
        companyname: 'CONSULTING GROUP',
        companyType: 'mycompany',
        email: 'info@consulting.tn',
        address: 'Sfax, Avenue Habib',
        phones: ['+21612345678'],
        city: 'Sfax',
        country: 'Tunisia',
        notes: 'Business consulting',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null
      }
    ]);

    // Insert Employees (with userId)
    const employeesResult = await db.collection('employees').insertMany([
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        firstName: 'Amira',
        lastName: 'Ben Ali',
        email: 'amira@startup.tn',
        phone: '+21698765432',
        cnssApplicable: true,
        monthlyNetSalary: 2500,
        cnssRatePercent: 9.18,
        notes: 'Senior Developer',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        firstName: 'Mohamed',
        lastName: 'Salah',
        email: 'mohamed@startup.tn',
        phone: '+21612345678',
        cnssApplicable: true,
        monthlyNetSalary: 2000,
        cnssRatePercent: 9.18,
        notes: 'Full Stack Developer',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        firstName: 'Yasmine',
        lastName: 'Karim',
        email: 'yasmine@startup.tn',
        phone: '+21699887766',
        cnssApplicable: true,
        monthlyNetSalary: 1800,
        cnssRatePercent: 9.18,
        notes: 'UX Designer',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        firstName: 'Karim',
        lastName: 'Ben Jemaa',
        email: 'karim@startup.tn',
        phone: '+21688776655',
        cnssApplicable: false,
        monthlyNetSalary: 1500,
        cnssRatePercent: 0,
        notes: 'Intern',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company2Id,
        firstName: 'Leila',
        lastName: 'Mansour',
        email: 'leila@consulting.tn',
        phone: '+21677665544',
        cnssApplicable: true,
        monthlyNetSalary: 3000,
        cnssRatePercent: 9.18,
        notes: 'Consultant Manager',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company2Id,
        firstName: 'Sami',
        lastName: 'Hamzaoui',
        email: 'sami@consulting.tn',
        phone: '+21666554433',
        cnssApplicable: true,
        monthlyNetSalary: 2200,
        cnssRatePercent: 9.18,
        notes: 'Business Analyst',
        createdAt: new Date(),
        deletedAt: null
      }
    ]);

    const empIds = (await db.collection('employees').find({}).toArray()).map(e => e._id);

    // Insert Salaries (with userId)
    await db.collection('salaries').insertMany(
      empIds.map(empId => ({
        _id: new ObjectId(),
        userId: userId,
        employeeId: empId,
        month: '2026-02',
        netAmount: 2500,
        isPaid: false,
        createdAt: new Date(),
        deletedAt: null
      }))
    );

    // Insert CNSS (with userId)
    await db.collection('cnsspayments').insertMany(
      empIds.filter((_, i) => i < 5).map(empId => ({
        _id: new ObjectId(),
        userId: userId,
        employeeId: empId,
        month: '2026-02',
        amount: 250,
        paymentDate: '2026-02-05',
        createdAt: new Date(),
        deletedAt: null
      }))
    );

    // Insert TVA Payments (with userId and companyId)
    await db.collection('tvapayments').insertMany([
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        month: '2026-02',
        amount: 1365,
        paymentDate: '2026-02-05',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company2Id,
        month: '2026-02',
        amount: 420,
        paymentDate: '2026-02-05',
        createdAt: new Date(),
        deletedAt: null
      }
    ]);

    // Insert Tax Settings (with userId and companyId)
    await db.collection('taxsettings').insertMany([
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company1Id,
        tvaRate: 21,
        tvaCategory: 'standard',
        createdAt: new Date(),
        deletedAt: null
      },
      {
        _id: new ObjectId(),
        userId: userId,
        companyId: company2Id,
        tvaRate: 21,
        tvaCategory: 'standard',
        createdAt: new Date(),
        deletedAt: null
      }
    ]);

    console.log('\n✓ Test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('✓ 1 Test User');
    console.log('  Email: test@invoice.com');
    console.log('  Password: password123');
    console.log('\n  ✓ 2 Companies (mycompany type)');
    console.log('  ✓ 6 Employees');
    console.log('  ✓ 6 Salary records (Feb 2026)');
    console.log('  ✓ 5 CNSS payments (Feb 2026)');
    console.log('  ✓ 2 TVA payments (Feb 2026)');
    console.log('  ✓ 2 Tax settings');
    console.log('\n✅ All data is now properly scoped to the test user!');

  } catch (error) {
    console.error('Error seeding:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
