const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const mongoUrl = 'mongodb://localhost:27017/invoice-app';

async function seedDatabase() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('invoice-app');
    
    console.log('Creating collections and inserting test data...');

    // Create Companies (mycompany type)
    const companiesCollection = db.collection('companies');
    const companies = await companiesCollection.insertMany([
      {
        _id: new ObjectId(),
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
        _id: new ObjectId(),
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

    const company1Id = companies.insertedIds[0];
    const company2Id = companies.insertedIds[1];

    // Create Clients (Suppliers and Buyers)
    const clientsCollection = db.collection('clients');
    const clients = await clientsCollection.insertMany([
      // Suppliers
      {
        _id: new ObjectId(),
        companyname: 'AHMED IMPORT EXPORT',
        companyType: 'supplier',
        email: 'ahmed@import.tn',
        address: 'Sfax Port',
        phones: ['+21625555555'],
        city: 'Sfax',
        country: 'Tunisia',
        notes: 'Wholesale supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyname: 'FATIMA PRODUCTS',
        companyType: 'supplier',
        email: 'fatima@products.tn',
        address: 'Sousse, Rue Principal',
        phones: ['+21633333333'],
        city: 'Sousse',
        country: 'Tunisia',
        notes: 'Retail products',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        notes: 'Transport services',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      // Buyers
      {
        _id: new ObjectId(),
        companyname: 'CARREFOUR TUNISIA',
        companyType: 'client',
        email: 'contact@carrefour.tn',
        address: 'Tunis, Town Center',
        phones: ['+21699999999'],
        city: 'Tunis',
        country: 'Tunisia',
        notes: 'Retail chain',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyname: 'MONOPRIX STORES',
        companyType: 'client',
        email: 'sales@monoprix.tn',
        address: 'Tunis, Centre Ville',
        phones: ['+21644444444'],
        city: 'Tunis',
        country: 'Tunisia',
        notes: 'Supermarket chain',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyname: 'PRIVÉ RESTAURANT GROUP',
        companyType: 'client',
        email: 'reservations@prive.tn',
        address: 'Tunis, La Marsa',
        phones: ['+21677777777'],
        city: 'Tunis',
        country: 'Tunisia',
        notes: 'Restaurant chain',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    const supplier1 = clients.insertedIds[0];
    const supplier2 = clients.insertedIds[1];
    const supplier3 = clients.insertedIds[2];
    const buyer1 = clients.insertedIds[3];
    const buyer2 = clients.insertedIds[4];
    const buyer3 = clients.insertedIds[5];

    // Create Employees
    const employeesCollection = db.collection('employees');
    const employees = await employeesCollection.insertMany([
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    const emp1 = employees.insertedIds[0];
    const emp2 = employees.insertedIds[1];
    const emp3 = employees.insertedIds[2];
    const emp4 = employees.insertedIds[3];
    const emp5 = employees.insertedIds[4];
    const emp6 = employees.insertedIds[5];

    // Create Invoices (Buying)
    const invoicesCollection = db.collection('invoices');
    await invoicesCollection.insertMany([
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
        notes: 'Annual software licenses',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        isDeleted: false
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
        notes: 'Monthly office supplies',
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date('2026-01-20'),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        invoiceNumber: 'AC-C-001',
        invoiceDate: new Date('2026-01-25'),
        dueDate: new Date('2026-02-25'),
        supplierId: supplier3,
        invoiceType: 'buying',
        items: [
          { description: 'Transport Services', quantity: 1, unitPrice: 2000, total: 2000 }
        ],
        totalHT: 2000,
        totalTVA: 420,
        totalTTC: 2420,
        isPaid: true,
        paidDate: new Date('2026-02-01'),
        notes: 'Logistics services',
        createdAt: new Date('2026-01-25'),
        updatedAt: new Date('2026-02-01'),
        isDeleted: false
      },
      // Selling invoices
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
        notes: 'Q1 2026 services',
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-01-10'),
        isDeleted: false
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
        paidDate: new Date('2026-01-25'),
        notes: 'Project ABC deliverables',
        createdAt: new Date('2026-01-18'),
        updatedAt: new Date('2026-01-25'),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        invoiceNumber: 'INV-C-001',
        invoiceDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        clientId: buyer3,
        invoiceType: 'selling',
        items: [
          { description: 'Consulting Services', quantity: 25, unitPrice: 150, total: 3750 }
        ],
        totalHT: 3750,
        totalTVA: 787.5,
        totalTTC: 4537.5,
        isPaid: false,
        notes: 'Strategy consulting',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
        isDeleted: false
      }
    ]);

    // Create Salaries
    const salariesCollection = db.collection('salaries');
    await salariesCollection.insertMany([
      {
        _id: new ObjectId(),
        employeeId: emp1,
        month: '2026-01',
        netAmount: 2500,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp2,
        month: '2026-01',
        netAmount: 2000,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp3,
        month: '2026-01',
        netAmount: 1800,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp4,
        month: '2026-01',
        netAmount: 1500,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp5,
        month: '2026-01',
        netAmount: 3000,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp6,
        month: '2026-01',
        netAmount: 2200,
        isPaid: true,
        paidDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    // Create CNSS Payments
    const cnssCollection = db.collection('cnsspayments');
    await cnssCollection.insertMany([
      {
        _id: new ObjectId(),
        employeeId: emp1,
        month: '2026-01',
        amount: 229.5,
        paymentDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp2,
        month: '2026-01',
        amount: 183.6,
        paymentDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp3,
        month: '2026-01',
        amount: 165.24,
        paymentDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp5,
        month: '2026-01',
        amount: 275.4,
        paymentDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        employeeId: emp6,
        month: '2026-01',
        amount: 201.96,
        paymentDate: '2026-01-31',
        notes: 'Auto-generated',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    // Create TVA Payments
    const tvaCollection = db.collection('tvapayments');
    await tvaCollection.insertMany([
      {
        _id: new ObjectId(),
        companyId: company1Id,
        month: '2026-01',
        tvaPaid: 1365,
        paymentDate: new Date('2026-02-05'),
        notes: 'January TVA payment',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        month: '2026-01',
        tvaPaid: 420,
        paymentDate: new Date('2026-02-05'),
        notes: 'January TVA payment',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    // Create Tax Settings
    const taxSettingsCollection = db.collection('taxsettings');
    await taxSettingsCollection.insertMany([
      {
        _id: new ObjectId(),
        companyId: company1Id,
        tvaRate: 21,
        tvaCategory: 'standard',
        notes: 'Standard VAT rate for STARTUP TUNISIA',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      },
      {
        _id: new ObjectId(),
        companyId: company2Id,
        tvaRate: 21,
        tvaCategory: 'standard',
        notes: 'Standard VAT rate for CONSULTING GROUP',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }
    ]);

    console.log('✓ Test data inserted successfully!');
    console.log('\nSummary:');
    console.log('- 2 Companies (mycompany)');
    console.log('- 6 Clients (3 suppliers + 3 buyers)');
    console.log('- 6 Employees');
    console.log('- 6 Invoices (3 buying + 3 selling)');
    console.log('- 6 Salary records');
    console.log('- 5 CNSS payment records');
    console.log('- 2 TVA payment records');
    console.log('- 2 Tax settings');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedDatabase();
