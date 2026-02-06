const mongoose = require('mongoose');

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoice-app');
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const collections = db.collections;

    // Define schemas inline for seeding
    const ObjectId = mongoose.Types.ObjectId;

    const company1Id = new ObjectId();
    const company2Id = new ObjectId();

    // Clear existing data (optional)
    await db.dropCollection('companies').catch(() => {});
    await db.dropCollection('clients').catch(() => {});
    await db.dropCollection('employees').catch(() => {});
    await db.dropCollection('invoices').catch(() => {});
    await db.dropCollection('salaries').catch(() => {});
    await db.dropCollection('cnsspayments').catch(() => {});
    await db.dropCollection('tvapayments').catch(() => {});
    await db.dropCollection('taxsettings').catch(() => {});

    // Insert Companies
    const companiesResult = await db.collection('companies').insertMany([
      {
        _id: company1Id,
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
        isDeleted: false
      },
      {
        _id: company2Id,
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
        isDeleted: false
      }
    ]);

    // Insert Clients
    const clientsResult = await db.collection('clients').insertMany([
      {
        _id: new ObjectId(),
        companyname: 'AHMED IMPORT EXPORT',
        companyType: 'supplier',
        email: 'ahmed@import.tn',
        address: 'Sfax Port',
        phones: ['+21625555555'],
        city: 'Sfax',
        country: 'Tunisia',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyname: 'FATIMA PRODUCTS',
        companyType: 'supplier',
        email: 'fatima@products.tn',
        address: 'Sousse',
        phones: ['+21633333333'],
        city: 'Sousse',
        country: 'Tunisia',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyname: 'DJERBA LOGISTICS',
        companyType: 'supplier',
        email: 'info@djerba.tn',
        address: 'Djerba',
        phones: ['+21622222222'],
        city: 'Djerba',
        country: 'Tunisia',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyname: 'CARREFOUR TUNISIA',
        companyType: 'client',
        email: 'contact@carrefour.tn',
        address: 'Tunis',
        phones: ['+21699999999'],
        city: 'Tunis',
        country: 'Tunisia',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyname: 'MONOPRIX STORES',
        companyType: 'client',
        email: 'sales@monoprix.tn',
        address: 'Tunis',
        phones: ['+21644444444'],
        city: 'Tunis',
        country: 'Tunisia',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyname: 'PRIVÉ RESTAURANT GROUP',
        companyType: 'client',
        email: 'reservations@prive.tn',
        address: 'Tunis',
        phones: ['+21677777777'],
        city: 'Tunis',
        country: 'Tunisia',
        createdAt: new Date()
      }
    ]);

    const clientIds = clientsResult.insertedIds;
    const supplier1 = clientIds[0];
    const supplier2 = clientIds[1];
    const supplier3 = clientIds[2];
    const buyer1 = clientIds[3];
    const buyer2 = clientIds[4];
    const buyer3 = clientIds[5];

    // Insert Employees
    const employeesResult = await db.collection('employees').insertMany([
      {
        _id: new ObjectId(),
        companyId: company1Id,
        firstName: 'Amira',
        lastName: 'Ben Ali',
        email: 'amira@startup.tn',
        phone: '+21698765432',
        cnssApplicable: true,
        monthlyNetSalary: 2500,
        cnssRatePercent: 9.18,
        notes: 'Senior Developer',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        firstName: 'Mohamed',
        lastName: 'Salah',
        email: 'mohamed@startup.tn',
        phone: '+21612345678',
        cnssApplicable: true,
        monthlyNetSalary: 2000,
        cnssRatePercent: 9.18,
        notes: 'Full Stack Developer',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        firstName: 'Yasmine',
        lastName: 'Karim',
        email: 'yasmine@startup.tn',
        phone: '+21699887766',
        cnssApplicable: true,
        monthlyNetSalary: 1800,
        cnssRatePercent: 9.18,
        notes: 'UX Designer',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        firstName: 'Karim',
        lastName: 'Ben Jemaa',
        email: 'karim@startup.tn',
        phone: '+21688776655',
        cnssApplicable: false,
        monthlyNetSalary: 1500,
        cnssRatePercent: 0,
        notes: 'Intern',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        firstName: 'Leila',
        lastName: 'Mansour',
        email: 'leila@consulting.tn',
        phone: '+21677665544',
        cnssApplicable: true,
        monthlyNetSalary: 3000,
        cnssRatePercent: 9.18,
        notes: 'Consultant Manager',
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        firstName: 'Sami',
        lastName: 'Hamzaoui',
        email: 'sami@consulting.tn',
        phone: '+21666554433',
        cnssApplicable: true,
        monthlyNetSalary: 2200,
        cnssRatePercent: 9.18,
        notes: 'Business Analyst',
        createdAt: new Date()
      }
    ]);

    const empIds = employeesResult.insertedIds;

    // Insert Invoices
    await db.collection('invoices').insertMany([
      {
        _id: new ObjectId(),
        companyId: company1Id,
        invoiceNumber: 'ACHAT-001',
        invoiceDate: new Date('2026-01-15'),
        dueDate: new Date('2026-02-15'),
        supplierId: supplier1,
        invoiceType: 'buying',
        items: [
          { description: 'Software Licenses', quantity: 10, unitPrice: 100, total: 1000 },
          { description: 'Cloud Services', quantity: 1, unitPrice: 500, total: 500 }
        ],
        totalHT: 1500,
        totalTVA: 315,
        totalTTC: 1815,
        isPaid: false,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        invoiceNumber: 'ACHAT-002',
        invoiceDate: new Date('2026-01-20'),
        dueDate: new Date('2026-02-20'),
        supplierId: supplier2,
        invoiceType: 'buying',
        items: [
          { description: 'Office Supplies', quantity: 50, unitPrice: 20, total: 1000 },
          { description: 'Equipment', quantity: 2, unitPrice: 300, total: 600 }
        ],
        totalHT: 1600,
        totalTVA: 336,
        totalTTC: 1936,
        isPaid: false,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        invoiceNumber: 'AC-C-001',
        invoiceDate: new Date('2026-01-25'),
        supplierId: supplier3,
        invoiceType: 'buying',
        items: [{ description: 'Transport Services', quantity: 1, unitPrice: 2000, total: 2000 }],
        totalHT: 2000,
        totalTVA: 420,
        totalTTC: 2420,
        isPaid: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        invoiceNumber: 'VENTE-001',
        invoiceDate: new Date('2026-01-10'),
        dueDate: new Date('2026-02-10'),
        clientId: buyer1,
        invoiceType: 'selling',
        items: [
          { description: 'Consulting Services', quantity: 20, unitPrice: 100, total: 2000 },
          { description: 'Development Hours', quantity: 40, unitPrice: 75, total: 3000 }
        ],
        totalHT: 5000,
        totalTVA: 1050,
        totalTTC: 6050,
        isPaid: false,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company1Id,
        invoiceNumber: 'VENTE-002',
        invoiceDate: new Date('2026-01-18'),
        dueDate: new Date('2026-02-18'),
        clientId: buyer2,
        invoiceType: 'selling',
        items: [
          { description: 'UI/UX Design', quantity: 10, unitPrice: 120, total: 1200 },
          { description: 'Frontend Development', quantity: 30, unitPrice: 90, total: 2700 }
        ],
        totalHT: 3900,
        totalTVA: 819,
        totalTTC: 4719,
        isPaid: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        invoiceNumber: 'INV-C-001',
        invoiceDate: new Date('2026-02-01'),
        clientId: buyer3,
        invoiceType: 'selling',
        items: [{ description: 'Consulting Services', quantity: 25, unitPrice: 150, total: 3750 }],
        totalHT: 3750,
        totalTVA: 787.5,
        totalTTC: 4537.5,
        isPaid: false,
        createdAt: new Date()
      }
    ]);

    // Insert Salaries
    await db.collection('salaries').insertMany([
      { _id: new ObjectId(), employeeId: empIds[0], month: '2026-01', netAmount: 2500, isPaid: true, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[1], month: '2026-01', netAmount: 2000, isPaid: true, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[2], month: '2026-01', netAmount: 1800, isPaid: true, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[3], month: '2026-01', netAmount: 1500, isPaid: true, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[4], month: '2026-01', netAmount: 3000, isPaid: true, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[5], month: '2026-01', netAmount: 2200, isPaid: true, createdAt: new Date() }
    ]);

    // Insert CNSS
    await db.collection('cnsspayments').insertMany([
      { _id: new ObjectId(), employeeId: empIds[0], month: '2026-01', amount: 229.5, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[1], month: '2026-01', amount: 183.6, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[2], month: '2026-01', amount: 165.24, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[4], month: '2026-01', amount: 275.4, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empIds[5], month: '2026-01', amount: 201.96, createdAt: new Date() }
    ]);

    // Insert TVA Payments
    await db.collection('tvapayments').insertMany([
      { _id: new ObjectId(), companyId: company1Id, month: '2026-01', tvaPaid: 1365, createdAt: new Date() },
      { _id: new ObjectId(), companyId: company2Id, month: '2026-01', tvaPaid: 420, createdAt: new Date() }
    ]);

    // Insert Tax Settings
    await db.collection('taxsettings').insertMany([
      { _id: new ObjectId(), companyId: company1Id, tvaRate: 21, tvaCategory: 'standard', createdAt: new Date() },
      { _id: new ObjectId(), companyId: company2Id, tvaRate: 21, tvaCategory: 'standard', createdAt: new Date() }
    ]);

    console.log('✓ Test data seeded successfully!');
    console.log('\n��� Summary:');
    console.log('  • 2 Companies');
    console.log('  • 6 Clients (suppliers + buyers)');
    console.log('  • 6 Employees');
    console.log('  • 6 Invoices');
    console.log('  • 6 Salary records');
    console.log('  • 5 CNSS payments');
    console.log('  • 2 TVA payments');
    console.log('  • 2 Tax settings');
    console.log('\n✅ Ready for testing!');

  } catch (error) {
    console.error('Error seeding:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
