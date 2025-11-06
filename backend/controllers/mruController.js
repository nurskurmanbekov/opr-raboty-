const { MRU, District, User } = require('../models');

// @desc    Получить все МРУ
// @route   GET /api/mru
// @access  Private (central_admin, mru_manager, auditor)
exports.getAllMRU = async (req, res, next) => {
  try {
    const mrus = await MRU.findAll({
      include: [
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name', 'city', 'code', 'isActive']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: mrus.length,
      data: mrus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить одно МРУ по ID
// @route   GET /api/mru/:id
// @access  Private
exports.getMRUById = async (req, res, next) => {
  try {
    const mru = await MRU.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'districts',
          include: [
            {
              model: User,
              as: 'users',
              where: { role: 'officer' },
              required: false,
              attributes: ['id', 'fullName', 'email', 'phone', 'role']
            }
          ]
        }
      ]
    });

    if (!mru) {
      return res.status(404).json({
        success: false,
        message: 'МРУ не найдено'
      });
    }

    res.json({
      success: true,
      data: mru
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создать новое МРУ
// @route   POST /api/mru
// @access  Private (central_admin only)
exports.createMRU = async (req, res, next) => {
  try {
    const { name, region, code, description } = req.body;

    // Проверка на дублирование кода
    if (code) {
      const existingMRU = await MRU.findOne({ where: { code } });
      if (existingMRU) {
        return res.status(400).json({
          success: false,
          message: 'МРУ с таким кодом уже существует'
        });
      }
    }

    const mru = await MRU.create({
      name,
      region,
      code,
      description
    });

    res.status(201).json({
      success: true,
      message: 'МРУ успешно создано',
      data: mru
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Обновить МРУ
// @route   PUT /api/mru/:id
// @access  Private (central_admin only)
exports.updateMRU = async (req, res, next) => {
  try {
    const mru = await MRU.findByPk(req.params.id);

    if (!mru) {
      return res.status(404).json({
        success: false,
        message: 'МРУ не найдено'
      });
    }

    const { name, region, code, description, isActive } = req.body;

    // Проверка на дублирование кода (если код изменился)
    if (code && code !== mru.code) {
      const existingMRU = await MRU.findOne({ where: { code } });
      if (existingMRU) {
        return res.status(400).json({
          success: false,
          message: 'МРУ с таким кодом уже существует'
        });
      }
    }

    await mru.update({
      name: name || mru.name,
      region: region || mru.region,
      code: code || mru.code,
      description: description !== undefined ? description : mru.description,
      isActive: isActive !== undefined ? isActive : mru.isActive
    });

    res.json({
      success: true,
      message: 'МРУ успешно обновлено',
      data: mru
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Удалить МРУ (soft delete - деактивация)
// @route   DELETE /api/mru/:id
// @access  Private (central_admin only)
exports.deleteMRU = async (req, res, next) => {
  try {
    const mru = await MRU.findByPk(req.params.id);

    if (!mru) {
      return res.status(404).json({
        success: false,
        message: 'МРУ не найдено'
      });
    }

    // Проверяем, есть ли активные районы
    const activeDistricts = await District.count({
      where: { mruId: mru.id, isActive: true }
    });

    if (activeDistricts > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить МРУ. Есть ${activeDistricts} активных районов. Сначала деактивируйте все районы.`
      });
    }

    // Soft delete - просто деактивируем
    await mru.update({ isActive: false });

    res.json({
      success: true,
      message: 'МРУ успешно деактивировано'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по МРУ
// @route   GET /api/mru/:id/stats
// @access  Private
exports.getMRUStats = async (req, res, next) => {
  try {
    const mru = await MRU.findByPk(req.params.id);

    if (!mru) {
      return res.status(404).json({
        success: false,
        message: 'МРУ не найдено'
      });
    }

    // Количество районов
    const districtsCount = await District.count({
      where: { mruId: mru.id, isActive: true }
    });

    // Количество офицеров
    const officersCount = await User.count({
      where: { mruId: mru.id, role: 'officer', isActive: true }
    });

    // Количество клиентов (через офицеров)
    const { Client } = require('../models');
    const officers = await User.findAll({
      where: { mruId: mru.id, role: 'officer', isActive: true },
      attributes: ['id']
    });
    const officerIds = officers.map(o => o.id);

    const clientsCount = await Client.count({
      where: { officerId: officerIds }
    });

    res.json({
      success: true,
      data: {
        mru: {
          id: mru.id,
          name: mru.name,
          region: mru.region
        },
        districts: districtsCount,
        officers: officersCount,
        clients: clientsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
