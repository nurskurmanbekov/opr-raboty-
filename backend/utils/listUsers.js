const { User, Client } = require('../models');
const { connectDB } = require('../config/database');
require('dotenv').config();

/**
 * Утилита для просмотра всех пользователей в системе
 */
const listAllUsers = async () => {
  try {
    console.log('🔍 Подключение к базе данных...\n');
    await connectDB();

    // Получить всех пользователей
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'district', 'isActive', 'createdAt'],
      order: [['role', 'ASC'], ['createdAt', 'ASC']]
    });

    // Получить всех клиентов
    const clients = await Client.findAll({
      attributes: ['id', 'fullName', 'email', 'phone', 'idNumber', 'status', 'assignedHours', 'completedHours'],
      order: [['createdAt', 'ASC']]
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ПОЛЬЗОВАТЕЛИ СИСТЕМЫ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (users.length === 0) {
      console.log('⚠️  В базе данных нет пользователей!');
      console.log('\n💡 Запустите seed.js для создания тестовых пользователей:');
      console.log('   node backend/seed.js\n');
    } else {
      console.log(`📊 Всего пользователей: ${users.length}\n`);

      // Группировка по ролям
      const usersByRole = {};
      users.forEach(user => {
        if (!usersByRole[user.role]) {
          usersByRole[user.role] = [];
        }
        usersByRole[user.role].push(user);
      });

      // Вывод по ролям
      Object.keys(usersByRole).sort().forEach(role => {
        const roleUsers = usersByRole[role];
        console.log(`\n🎭 ${role.toUpperCase()} (${roleUsers.length}):`);
        console.log('─'.repeat(65));

        roleUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.fullName}`);
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   📱 Телефон: ${user.phone}`);
          console.log(`   📍 Район: ${user.district || 'Не указан'}`);
          console.log(`   ✅ Статус: ${user.isActive ? 'Активен' : 'Неактивен'}`);
          console.log(`   🆔 ID: ${user.id}`);
          console.log('');
        });
      });
    }

    // Вывод клиентов
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                   КЛИЕНТЫ (МОБИЛЬНОЕ ПРИЛОЖЕНИЕ)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (clients.length === 0) {
      console.log('⚠️  В базе данных нет клиентов!\n');
    } else {
      console.log(`📊 Всего клиентов: ${clients.length}\n`);

      clients.forEach((client, index) => {
        const progress = client.assignedHours > 0
          ? Math.round((client.completedHours / client.assignedHours) * 100)
          : 0;

        console.log(`${index + 1}. ${client.fullName}`);
        console.log(`   📧 Email: ${client.email}`);
        console.log(`   📱 Телефон: ${client.phone}`);
        console.log(`   🆔 ИНН: ${client.idNumber}`);
        console.log(`   📊 Статус: ${client.status}`);
        console.log(`   ⏱️  Прогресс: ${client.completedHours}/${client.assignedHours} часов (${progress}%)`);
        console.log(`   🆔 ID: ${client.id}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ТЕСТОВЫЕ УЧЕТНЫЕ ДАННЫЕ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔐 Пароль для всех тестовых пользователей: 123456\n');
    console.log('📝 Для входа используйте:\n');
    console.log('   Superadmin:      admin@probation.kg');
    console.log('   Regional Admin:  regional@probation.kg');
    console.log('   District Admin:  admin.bishkek@probation.kg или admin.osh@probation.kg');
    console.log('   Officer:         officer@probation.kg или officer2@probation.kg');
    console.log('   Supervisor:      supervisor@probation.kg');
    console.log('   Analyst:         analyst@probation.kg');
    console.log('   Client:          client1@probation.kg, client2@probation.kg, client3@probation.kg');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при получении пользователей:', error);
    process.exit(1);
  }
};

// Запуск утилиты
listAllUsers();
