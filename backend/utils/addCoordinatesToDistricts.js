const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Скрипт для добавления поля coordinates в таблицу Districts
 */
const addCoordinatesColumn = async () => {
  try {
    console.log('🔧 Начало миграции базы данных...\n');

    // Проверяем подключение к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено\n');

    // Добавляем колонку coordinates если её нет
    console.log('📝 Добавление колонки coordinates...');
    try {
      await sequelize.query(`
        ALTER TABLE "Districts"
        ADD COLUMN IF NOT EXISTS "coordinates" JSON NULL;
      `);

      await sequelize.query(`
        COMMENT ON COLUMN "Districts"."coordinates" IS 'Координаты для отображения на карте: { lat: number, lng: number, svgPath?: string }';
      `);

      console.log('✅ Колонка coordinates добавлена\n');
    } catch (error) {
      console.log('⚠️  Колонка coordinates уже существует или ошибка:', error.message);
    }

    // Проверяем структуру таблицы
    console.log('📊 Проверка структуры таблицы Districts...\n');
    const [columns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'Districts'
      AND column_name = 'coordinates'
      ORDER BY column_name;
    `);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   СТРУКТУРА ТАБЛИЦЫ DISTRICTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (columns.length > 0) {
      columns.forEach(col => {
        console.log(`📌 ${col.column_name}:`);
        console.log(`   Тип: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log(`   По умолчанию: ${col.column_default || 'нет'}\n');
      });
    } else {
      console.log('⚠️  Колонка не найдена\n');
    }

    // Проверяем количество районов
    const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM "Districts";`);
    console.log(`📊 Всего районов в системе: ${result[0].count}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ Теперь можно добавлять координаты к районам!');
    console.log('💡 Перезапустите backend сервер для применения изменений\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при миграции базы данных:', error);
    console.error('📋 Детали ошибки:', error.message);
    process.exit(1);
  }
};

// Запуск миграции
addCoordinatesColumn();
