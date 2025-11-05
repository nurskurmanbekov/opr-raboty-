const { User, Client } = require('./models');
const { connectDB } = require('./config/database');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing test data...');
    await Client.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 1. Create Superadmin
    console.log('👤 Creating superadmin...');
    const superadmin = await User.create({
      fullName: 'Суперадминистратор Системы',
      email: 'admin@probation.kg',
      phone: '+996700000001',
      password: '123456',
      role: 'superadmin',
      district: null,
      permissions: [],
      managedDistricts: [],
      isActive: true
    });
    console.log('✅ Superadmin created:', superadmin.email);

    // 2. Create Regional Admin
    console.log('👤 Creating regional admin...');
    const regionalAdmin = await User.create({
      fullName: 'Региональный Администратор',
      email: 'regional@probation.kg',
      phone: '+996700000002',
      password: '123456',
      role: 'regional_admin',
      district: null,
      managedDistricts: ['Бишкек', 'Чуй', 'Кара-Балта'],
      isActive: true
    });
    console.log('✅ Regional Admin created:', regionalAdmin.email);

    // 3. Create District Admins
    console.log('👤 Creating district admins...');
    const districtAdminBishkek = await User.create({
      fullName: 'Администратор Бишкек',
      email: 'admin.bishkek@probation.kg',
      phone: '+996700000003',
      password: '123456',
      role: 'district_admin',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ District Admin (Bishkek) created:', districtAdminBishkek.email);

    const districtAdminOsh = await User.create({
      fullName: 'Администратор Ош',
      email: 'admin.osh@probation.kg',
      phone: '+996700000004',
      password: '123456',
      role: 'district_admin',
      district: 'Ош',
      isActive: true
    });
    console.log('✅ District Admin (Osh) created:', districtAdminOsh.email);

    // 4. Create Officers
    console.log('👤 Creating officers...');
    const officer = await User.create({
      fullName: 'Куратор Иванов Иван',
      email: 'officer@probation.kg',
      phone: '+996700000005',
      password: '123456',
      role: 'officer',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ Officer 1 created:', officer.email);

    const officer2 = await User.create({
      fullName: 'Куратор Петров Петр',
      email: 'officer2@probation.kg',
      phone: '+996700000006',
      password: '123456',
      role: 'officer',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ Officer 2 created:', officer2.email);

    // 5. Create Supervisor
    console.log('👤 Creating supervisor...');
    const supervisor = await User.create({
      fullName: 'Супервайзер Сидоров',
      email: 'supervisor@probation.kg',
      phone: '+996700000007',
      password: '123456',
      role: 'supervisor',
      district: 'Бишкек',
      isActive: true
    });
    console.log('✅ Supervisor created:', supervisor.email);

    // 6. Create Analyst
    console.log('👤 Creating analyst...');
    const analyst = await User.create({
      fullName: 'Аналитик Системы',
      email: 'analyst@probation.kg',
      phone: '+996700000008',
      password: '123456',
      role: 'analyst',
      district: null,
      isActive: true
    });
    console.log('✅ Analyst created:', analyst.email);

    // 7. Create Test Clients
    console.log('👥 Creating test clients...');

    const client1 = await Client.create({
      fullName: 'Клиент Первый Тестовый',
      idNumber: '1234567890123',
      phone: '+996700111111',
      email: 'client1@probation.kg',
      password: '123456',
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
      notes: 'Тестовый клиент #3'
    });
    console.log('✅ Client 3 created:', client3.email);

    console.log('\n✅ ========================================');
    console.log('✅ Database seeding completed successfully!');
    console.log('✅ ========================================\n');

    console.log('📝 TEST CREDENTIALS:\n');
    console.log('🔐 SUPERADMIN:');
    console.log('   Email: admin@probation.kg');
    console.log('   Password: 123456\n');

    console.log('🔐 REGIONAL ADMIN:');
    console.log('   Email: regional@probation.kg');
    console.log('   Password: 123456\n');

    console.log('🔐 DISTRICT ADMINS:');
    console.log('   Email: admin.bishkek@probation.kg | Password: 123456');
    console.log('   Email: admin.osh@probation.kg | Password: 123456\n');

    console.log('🔐 OFFICERS:');
    console.log('   Email: officer@probation.kg | Password: 123456');
    console.log('   Email: officer2@probation.kg | Password: 123456\n');

    console.log('🔐 SUPERVISOR:');
    console.log('   Email: supervisor@probation.kg | Password: 123456\n');

    console.log('🔐 ANALYST:');
    console.log('   Email: analyst@probation.kg | Password: 123456\n');

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
