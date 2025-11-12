const { sequelize } = require('../config/database');

/**
 * Миграция: Добавление полей districtId и mruId в таблицу Geofences
 *
 * Цель: Обновить систему геозон для использования UUID ссылок вместо строковых значений
 *
 * Что делает:
 * 1. Добавляет поле districtId (UUID) с внешним ключом на Districts
 * 2. Добавляет поле mruId (UUID) с внешним ключом на MRUs
 * 3. Делает старое поле district nullable (для обратной совместимости)
 */
const addDistrictMruColumns = async () => {
  try {
    console.log('🔧 Начало миграции базы данных для Geofences...\n');

    // Проверка подключения
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено\n');

    // Step 1: Add districtId column
    console.log('📝 Шаг 1: Добавление колонки districtId...');
    await sequelize.query(`
      ALTER TABLE "Geofences"
      ADD COLUMN IF NOT EXISTS "districtId" UUID NULL;
    `);
    console.log('✅ Колонка districtId добавлена\n');

    // Step 2: Add mruId column
    console.log('📝 Шаг 2: Добавление колонки mruId...');
    await sequelize.query(`
      ALTER TABLE "Geofences"
      ADD COLUMN IF NOT EXISTS "mruId" UUID NULL;
    `);
    console.log('✅ Колонка mruId добавлена\n');

    // Step 3: Add foreign key for districtId
    console.log('📝 Шаг 3: Добавление внешнего ключа для districtId...');
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'Geofences_districtId_fkey'
        ) THEN
          ALTER TABLE "Geofences"
          ADD CONSTRAINT "Geofences_districtId_fkey"
          FOREIGN KEY ("districtId")
          REFERENCES "Districts"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✅ Внешний ключ для districtId добавлен\n');

    // Step 4: Add foreign key for mruId
    console.log('📝 Шаг 4: Добавление внешнего ключа для mruId...');
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'Geofences_mruId_fkey'
        ) THEN
          ALTER TABLE "Geofences"
          ADD CONSTRAINT "Geofences_mruId_fkey"
          FOREIGN KEY ("mruId")
          REFERENCES "MRUs"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✅ Внешний ключ для mruId добавлен\n');

    // Step 5: Make old district column nullable
    console.log('📝 Шаг 5: Изменение старого поля district на nullable...');
    await sequelize.query(`
      ALTER TABLE "Geofences"
      ALTER COLUMN "district" DROP NOT NULL;
    `);
    console.log('✅ Поле district теперь nullable\n');

    // Step 6: Add comments
    console.log('📝 Шаг 6: Добавление комментариев к полям...');
    await sequelize.query(`
      COMMENT ON COLUMN "Geofences"."district" IS 'Устаревшее поле, используйте districtId';
      COMMENT ON COLUMN "Geofences"."districtId" IS 'ID района из справочника';
      COMMENT ON COLUMN "Geofences"."mruId" IS 'ID МРУ из справочника (опционально)';
    `);
    console.log('✅ Комментарии добавлены\n');

    console.log('✨ Миграция успешно завершена!\n');
    console.log('📋 Что было сделано:');
    console.log('   ✓ Добавлена колонка districtId (UUID)');
    console.log('   ✓ Добавлена колонка mruId (UUID)');
    console.log('   ✓ Добавлены внешние ключи');
    console.log('   ✓ Старое поле district сделано nullable');
    console.log('   ✓ Добавлены комментарии к полям\n');
    console.log('💡 Следующие шаги:');
    console.log('   1. Обновить контроллер геозон для поддержки новых полей');
    console.log('   2. Обновить frontend для загрузки районов из API');
    console.log('   3. Постепенно мигрировать существующие геозоны на новую систему\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при выполнении миграции:', error);
    console.error('\n📝 Детали ошибки:');
    console.error(`   Сообщение: ${error.message}`);
    if (error.original) {
      console.error(`   SQL Ошибка: ${error.original.message}`);
    }
    console.error('\n💡 Возможные причины:');
    console.error('   - Таблица Geofences не существует');
    console.error('   - Таблицы Districts или MRUs не существуют');
    console.error('   - Нет прав на изменение таблицы');
    console.error('   - База данных не доступна\n');
    process.exit(1);
  }
};

// Запуск миграции
addDistrictMruColumns();
