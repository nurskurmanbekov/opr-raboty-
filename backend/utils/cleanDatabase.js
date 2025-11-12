const { User, Client } = require('../models');
const { connectDB } = require('../config/database');
require('dotenv').config();

/**
 * Скрипт для очистки базы данных
 * Удаляет всех клиентов и всех пользователей, кроме одного superadmin
 */
const cleanDatabase = async () => {
  try {
    console.log('🧹 Начало очистки базы данных...\n');
    await connectDB();

    // 1. Удалить всех клиентов
    console.log('🗑️  Удаление всех клиентов...');
    const deletedClients = await Client.destroy({ where: {} });
    console.log(`✅ Удалено клиентов: ${deletedClients}\n`);

    // 2. Найти или создать superadmin
    console.log('🔍 Поиск суперадминистратора...');
    let superadmin = await User.findOne({ where: { role: 'superadmin' } });

    if (!superadmin) {
      console.log('⚠️  Суперадминистратор не найден! Создаю нового...');
      superadmin = await User.create({
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
      console.log('✅ Суперадминистратор создан:', superadmin.email);
    } else {
      console.log('✅ Суперадминистратор найден:', superadmin.email);
    }

    // 3. Удалить всех пользователей кроме этого superadmin
    console.log('\n🗑️  Удаление всех остальных пользователей...');
    const deletedUsers = await User.destroy({
      where: {
        id: {
          [require('sequelize').Op.ne]: superadmin.id
        }
      }
    });
    console.log(`✅ Удалено пользователей: ${deletedUsers}\n`);

    // 4. Вывести итоговую статистику
    const totalUsers = await User.count();
    const totalClients = await Client.count();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ОЧИСТКА ЗАВЕРШЕНА');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 СТАТИСТИКА:');
    console.log(`   Всего пользователей в системе: ${totalUsers}`);
    console.log(`   Всего клиентов в системе: ${totalClients}\n`);

    console.log('🔐 ДАННЫЕ ДЛЯ ВХОДА:\n');
    console.log('   Email: ' + superadmin.email);
    console.log('   Пароль: 123456');
    console.log('   Роль: Superadmin\n');

    console.log('💡 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('   1. Войдите в систему как superadmin');
    console.log('   2. Создайте необходимых пользователей через веб-интерфейс');
    console.log('   3. Назначьте им МРУ и районы\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
    process.exit(1);
  }
};

// Запуск скрипта
cleanDatabase();
