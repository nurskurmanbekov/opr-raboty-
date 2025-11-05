const { User, Client } = require('./models');
const { connectDB } = require('./config/database');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing test data...');
    await Client.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 1. Create Superadmin
    console.log('👤 Creating superadmin...');
    const superadmin = await User.create({
      fullName: 'Суперадминистратор Системы',
      email: 'admin@probation.kg',
      phone: '+996700000001',
      password: '123456', // Will be hashed automatically by model hook
      role: 'superadmin',
      district: null,
      isActive: true
    });
    console.log('✅ Superadmin created:', superadmin.email);

    // 2. Create District Admin
    console.log('👤 Creating district admin...');
    const districtAdmin = await User.create({
      fullName: 'Администратор Бишкек',
      email: 'admin.bishkek@probation.kg',
      phone: '+996700000002',
      password: '123456',
      role: 'district_admin',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ District Admin created:', districtAdmin.email);

    // 3. Create Officer
    console.log('👤 Creating officer...');
    const officer = await User.create({
      fullName: 'Куратор Иванов Иван',
      email: 'officer@probation.kg',
      phone: '+996700000003',
      password: '123456',
      role: 'officer',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ Officer created:', officer.email);

    // 4. Create Test Clients
    console.log('👥 Creating test clients...');

    const client1 = await Client.create({
      fullName: 'Клиент Первый Тестовый',
      idNumber: '1234567890123',
      phone: '+996700111111',
      email: 'client1@probation.kg',
      password: '123456', // Will be hashed automatically
      district: 'Бишкек',
      assignedHours: 100,
      completedHours: 0,
      status: 'active',
      startDate: new Date('2025-01-01'),
      officerId: officer.id,
      workLocation: 'Парк "Ата-Тюрк"',
      notes: 'Тестовый клиент #1'
    });
    console.log('✅ Client 1 created:', client1.email);

    const client2 = await Client.create({
      fullName: 'Клиент Второй Тестовый',
      idNumber: '2234567890123',
      phone: '+996700222222',
      email: 'client2@probation.kg',
      password: '123456',
      district: 'Бишкек',
      assignedHours: 80,
      completedHours: 20,
      status: 'active',
      startDate: new Date('2025-01-15'),
      officerId: officer.id,
      workLocation: 'Городской парк',
      notes: 'Тестовый клиент #2'
    });
    console.log('✅ Client 2 created:', client2.email);

    const client3 = await Client.create({
      fullName: 'Клиент Третий Тестовый',
      idNumber: '3234567890123',
      phone: '+996700333333',
      email: 'client3@probation.kg',
      password: '123456',
      district: 'Бишкек',
      assignedHours: 60,
      completedHours: 45,
      status: 'active',
      startDate: new Date('2025-02-01'),
      officerId: officer.id,
      workLocation: 'Площадь Ала-Тоо',
      notes: 'Тестовый клиент #3 - почти завершил'
    });
    console.log('✅ Client 3 created:', client3.email);

    console.log('\n✅ ========================================');
    console.log('✅ Database seeding completed successfully!');
    console.log('✅ ========================================\n');

    console.log('📝 TEST CREDENTIALS:\n');
    console.log('🔐 SUPERADMIN:');
    console.log('   Email: admin@probation.kg');
    console.log('   Password: 123456\n');

    console.log('🔐 DISTRICT ADMIN:');
    console.log('   Email: admin.bishkek@probation.kg');
    console.log('   Password: 123456\n');

    console.log('🔐 OFFICER:');
    console.log('   Email: officer@probation.kg');
    console.log('   Password: 123456\n');

    console.log('🔐 CLIENTS:');
    console.log('   Email: client1@probation.kg | Password: 123456');
    console.log('   Email: client2@probation.kg | Password: 123456');
    console.log('   Email: client3@probation.kg | Password: 123456\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
