const { Client } = require('../models');
const { connectDB, sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Скрипт для обновления пароля клиента
 * Использовать когда нужно сбросить пароль клиента
 *
 * Использование:
 *   node backend/utils/updateClientPassword.js <email_или_idNumber> <новый_пароль>
 *
 * Пример:
 *   node backend/utils/updateClientPassword.js nnurskurmanbekov@gmail.com 123456
 */

const updateClientPassword = async (emailOrId, newPassword) => {
  try {
    console.log('🔐 Начало обновления пароля клиента...\n');

    await connectDB();
    console.log('✅ Подключение к базе данных установлено\n');

    // Найти клиента по email или idNumber
    let client = await Client.findOne({
      where: { email: emailOrId }
    });

    if (!client) {
      client = await Client.findOne({
        where: { idNumber: emailOrId }
      });
    }

    if (!client) {
      console.error(`❌ Клиент с email или ID "${emailOrId}" не найден!\n`);
      process.exit(1);
    }

    console.log('📋 Найден клиент:');
    console.log(`   ID: ${client.id}`);
    console.log(`   ФИО: ${client.fullName}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   ID номер: ${client.idNumber}\n`);

    // Обновить пароль (beforeUpdate хук автоматически захеширует)
    client.password = newPassword;
    await client.save();

    console.log('✅ Пароль успешно обновлен!');
    console.log(`💡 Теперь можно войти с паролем: ${newPassword}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при обновлении пароля:', error);
    console.error('📋 Детали ошибки:', error.message);
    process.exit(1);
  }
};

// Получить аргументы из командной строки
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Недостаточно аргументов!\n');
  console.log('Использование:');
  console.log('  node backend/utils/updateClientPassword.js <email_или_idNumber> <новый_пароль>\n');
  console.log('Пример:');
  console.log('  node backend/utils/updateClientPassword.js nnurskurmanbekov@gmail.com 123456\n');
  process.exit(1);
}

const [emailOrId, newPassword] = args;

// Запуск обновления
updateClientPassword(emailOrId, newPassword);
