const { District, MRU, User, Client } = require('../models');

// @desc    Получить все районы
// @route   GET /api/districts
// @access  Private
exports.getAllDistricts = async (req, res, next) => {
  try {
    const { mruId } = req.query;

    let whereClause = {};
    if (mruId) {
      whereClause.mruId = mruId;
    }

    const districts = await District.findAll({
      where: whereClause,
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить один район по ID
// @route   GET /api/districts/:id
// @access  Private
exports.getDistrictById = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id, {
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        },
        {
          model: User,
          as: 'users',
          where: { role: 'officer' },
          required: false,
          attributes: ['id', 'fullName', 'email', 'phone', 'role']
        }
      ]
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Район не найден'
      });
    }

    res.json({
      success: true,
      data: district
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создать новый район
// @route   POST /api/districts
// @access  Private (central_admin only)
exports.createDistrict = async (req, res, next) => {
  try {
    const { name, city, mruId, code, description } = req.body;

    // Проверка существования МРУ
    const mru = await MRU.findByPk(mruId);
    if (!mru) {
      return res.status(404).json({
        success: false,
        message: 'МРУ не найдено'
      });
    }

    // Проверка на дублирование кода
    if (code) {
      const existingDistrict = await District.findOne({ where: { code } });
      if (existingDistrict) {
        return res.status(400).json({
          success: false,
          message: 'Район с таким кодом уже существует'
        });
      }
    }

    const district = await District.create({
      name,
      city,
      mruId,
      code,
      description
    });

    // Получаем созданный район с МРУ
    const createdDistrict = await District.findByPk(district.id, {
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Район успешно создан',
      data: createdDistrict
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Обновить район
// @route   PUT /api/districts/:id
// @access  Private (central_admin only)
exports.updateDistrict = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Район не найден'
      });
    }

    const { name, city, mruId, code, description, isActive } = req.body;

    // Проверка существования МРУ (если изменяется)
    if (mruId && mruId !== district.mruId) {
      const mru = await MRU.findByPk(mruId);
      if (!mru) {
        return res.status(404).json({
          success: false,
          message: 'МРУ не найдено'
        });
      }
    }

    // Проверка на дублирование кода (если код изменился)
    if (code && code !== district.code) {
      const existingDistrict = await District.findOne({ where: { code } });
      if (existingDistrict) {
        return res.status(400).json({
          success: false,
          message: 'Район с таким кодом уже существует'
        });
      }
    }

    await district.update({
      name: name || district.name,
      city: city || district.city,
      mruId: mruId || district.mruId,
      code: code || district.code,
      description: description !== undefined ? description : district.description,
      isActive: isActive !== undefined ? isActive : district.isActive
    });

    // Получаем обновленный район с МРУ
    const updatedDistrict = await District.findByPk(district.id, {
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Район успешно обновлен',
      data: updatedDistrict
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Удалить район (soft delete - деактивация)
// @route   DELETE /api/districts/:id
// @access  Private (central_admin only)
exports.deleteDistrict = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Район не найден'
      });
    }

    // Проверяем, есть ли активные офицеры
    const activeOfficers = await User.count({
      where: { districtId: district.id, isActive: true }
    });

    if (activeOfficers > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить район. Есть ${activeOfficers} активных офицеров. Сначала переназначьте офицеров в другие районы.`
      });
    }

    // Soft delete - просто деактивируем
    await district.update({ isActive: false });

    res.json({
      success: true,
      message: 'Район успешно деактивирован'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по району
// @route   GET /api/districts/:id/stats
// @access  Private
exports.getDistrictStats = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id, {
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        }
      ]
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Район не найден'
      });
    }

    // Количество офицеров
    const officersCount = await User.count({
      where: { districtId: district.id, role: 'officer', isActive: true }
    });

    // Количество клиентов
    const officers = await User.findAll({
      where: { districtId: district.id, role: 'officer', isActive: true },
      attributes: ['id']
    });
    const officerIds = officers.map(o => o.id);

    const clientsCount = await Client.count({
      where: { officerId: officerIds }
    });

    // Количество активных клиентов
    const activeClientsCount = await Client.count({
      where: { officerId: officerIds, status: 'active' }
    });

    res.json({
      success: true,
      data: {
        district: {
          id: district.id,
          name: district.name,
          city: district.city
        },
        mru: district.mru,
        officers: officersCount,
        clients: clientsCount,
        activeClients: activeClientsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
