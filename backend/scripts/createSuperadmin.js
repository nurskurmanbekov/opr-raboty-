const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Скрипт для создания суперадминистратора
 * Использование: node scripts/createSuperadmin.js
 */

const createSuperadmin = async () => {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('✅ База данных подключена');

    // Данные суперадминистратора
    const superadminData = {
      fullName: 'Суперадминистратор',
      email: 'admin@probation.kg',
      phone: '+996700000000',
      password: 'admin123456', // ВАЖНО: Смените этот пароль после первого входа!
      role: 'superadmin',
      isActive: true,
      faceRegistered: false
    };

    // Проверяем, существует ли уже суперадмин
    const existingSuperadmin = await User.findOne({
      where: { email: superadminData.email }
    });

    if (existingSuperadmin) {
      console.log('⚠️  Суперадминистратор с email ' + superadminData.email + ' уже существует');
      console.log('   ID:', existingSuperadmin.id);
      console.log('   ФИО:', existingSuperadmin.fullName);
      console.log('   Email:', existingSuperadmin.email);
      console.log('   Роль:', existingSuperadmin.role);

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\nСоздать нового суперадмина с другим email? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          rl.question('Введите новый email: ', async (newEmail) => {
            rl.question('Введите ФИО: ', async (fullName) => {
              rl.question('Введите телефон: ', async (phone) => {
                rl.question('Введите пароль (минимум 6 символов): ', async (password) => {

                  superadminData.email = newEmail;
                  superadminData.fullName = fullName;
                  superadminData.phone = phone;
                  superadminData.password = password;

                  const hashedPassword = await bcrypt.hash(superadminData.password, 10);
                  superadminData.password = hashedPassword;

                  const newSuperadmin = await User.create(superadminData);

                  console.log('\n✅ Суперадминистратор успешно создан!');
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.log('📧 Email:', newSuperadmin.email);
                  console.log('👤 ФИО:', newSuperadmin.fullName);
                  console.log('📱 Телефон:', newSuperadmin.phone);
                  console.log('🔑 Роль:', newSuperadmin.role);
                  console.log('🆔 ID:', newSuperadmin.id);
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.log('\n⚠️  ВАЖНО: Смените пароль после первого входа!');

                  rl.close();
                  process.exit(0);
                });
              });
            });
          });
        } else {
          console.log('\n❌ Создание отменено');
          rl.close();
          process.exit(0);
        }
      });

      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(superadminData.password, 10);
    superadminData.password = hashedPassword;

    // Создаем суперадминистратора
    const superadmin = await User.create(superadminData);

    console.log('\n✅ Суперадминистратор успешно создан!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@probation.kg');
    console.log('🔐 Пароль: admin123456');
    console.log('👤 ФИО:', superadmin.fullName);
    console.log('📱 Телефон:', superadmin.phone);
    console.log('🔑 Роль:', superadmin.role);
    console.log('🆔 ID:', superadmin.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  ВАЖНО: Смените пароль после первого входа!');
    console.log('\n📱 Войдите в систему:');
    console.log('   Frontend: http://10.99.7.100:8091');
    console.log('   Email: admin@probation.kg');
    console.log('   Пароль: admin123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании суперадминистратора:', error);
    process.exit(1);
  }
};

// Запускаем скрипт
createSuperadmin();
