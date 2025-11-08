const { sequelize } = require('../config/database');
const { Client } = require('../models');
require('dotenv').config();

/**
 * Скрипт для добавления колонки districtId в таблицу Clients
 * И изменения поля district на nullable
 */
const addDistrictIdColumn = async () => {
  try {
    console.log('🔧 Начало миграции базы данных...\n');

    // Проверяем подключение к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено\n');

    // Шаг 1: Добавляем колонку districtId если её нет
    console.log('📝 Шаг 1: Добавление колонки districtId...');
    try {
      await sequelize.query(`
        ALTER TABLE "Clients"
        ADD COLUMN IF NOT EXISTS "districtId" UUID NULL;
      `);
      console.log('✅ Колонка districtId добавлена\n');
    } catch (error) {
      console.log('⚠️  Колонка districtId уже существует или ошибка:', error.message);
    }

    // Шаг 2: Добавляем внешний ключ на таблицу Districts
    console.log('📝 Шаг 2: Добавление внешнего ключа на Districts...');
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'Clients_districtId_fkey'
          ) THEN
            ALTER TABLE "Clients"
            ADD CONSTRAINT "Clients_districtId_fkey"
            FOREIGN KEY ("districtId")
            REFERENCES "Districts"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Внешний ключ добавлен\n');
    } catch (error) {
      console.log('⚠️  Внешний ключ уже существует или ошибка:', error.message);
    }

    // Шаг 3: Делаем поле district необязательным (nullable)
    console.log('📝 Шаг 3: Изменение поля district на nullable...');
    try {
      await sequelize.query(`
        ALTER TABLE "Clients"
        ALTER COLUMN "district" DROP NOT NULL;
      `);
      console.log('✅ Поле district теперь может быть NULL\n');
    } catch (error) {
      console.log('⚠️  Поле district уже nullable или ошибка:', error.message);
    }

    // Проверяем структуру таблицы
    console.log('📊 Проверка структуры таблицы Clients...\n');
    const [columns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'Clients'
      AND column_name IN ('district', 'districtId')
      ORDER BY column_name;
    `);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   СТРУКТУРА ТАБЛИЦЫ CLIENTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (columns.length > 0) {
      columns.forEach(col => {
        console.log(`📌 ${col.column_name}:`);
        console.log(`   Тип: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log(`   По умолчанию: ${col.column_default || 'нет'}\n`);
      });
    } else {
      console.log('⚠️  Колонки не найдены\n');
    }

    // Проверяем количество клиентов
    const clientsCount = await Client.count();
    console.log(`📊 Всего клиентов в системе: ${clientsCount}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ Теперь можно создавать клиентов с districtId!');
    console.log('💡 Перезапустите backend сервер для применения изменений\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при миграции базы данных:', error);
    console.error('📋 Детали ошибки:', error.message);
    process.exit(1);
  }
};

// Запуск миграции
addDistrictIdColumn();
