const { PendingApproval, User, Client, MRU, District, Notification } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Получить все заявки на одобрение
// @route   GET /api/approvals
// @access  Private (central_admin)
exports.getAllApprovals = async (req, res, next) => {
  try {
    const { status, type } = req.query;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.type = type;
    }

    const approvals = await PendingApproval.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'fullName', 'email', 'phone', 'role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: approvals.length,
      data: approvals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить одну заявку
// @route   GET /api/approvals/:id
// @access  Private
exports.getApprovalById = async (req, res, next) => {
  try {
    const approval = await PendingApproval.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'fullName', 'email', 'phone', 'role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'email'],
          required: false
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Одобрить заявку на регистрацию офицера
// @route   POST /api/approvals/:id/approve
// @access  Private (central_admin)
exports.approveApproval = async (req, res, next) => {
  try {
    const approval = await PendingApproval.findByPk(req.params.id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Заявка уже рассмотрена'
      });
    }

    const { mruId, districtId } = req.body;

    if (approval.type === 'officer') {
      // Создаем офицера
      const { fullName, email, phone, password } = approval.data;

      // Проверяем уникальность email
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }

      // Проверяем существование МРУ и района
      if (mruId) {
        const mru = await MRU.findByPk(mruId);
        if (!mru) {
          return res.status(404).json({
            success: false,
            message: 'МРУ не найдено'
          });
        }
      }

      if (districtId) {
        const district = await District.findByPk(districtId);
        if (!district) {
          return res.status(404).json({
            success: false,
            message: 'Район не найден'
          });
        }
      }

      // Создаем пользователя
      const newUser = await User.create({
        fullName,
        email,
        phone,
        password,
        role: 'officer',
        mruId,
        districtId,
        approvalStatus: 'approved',
        isActive: true
      });

      // Обновляем заявку
      await approval.update({
        status: 'approved',
        reviewerId: req.user.id,
        reviewedAt: new Date(),
        targetId: newUser.id,
        assignedMruId: mruId,
        assignedDistrictId: districtId
      });

      // Создаем уведомление для офицера
      await Notification.create({
        userId: newUser.id,
        type: 'approval',
        title: 'Заявка одобрена',
        message: `Ваша заявка на регистрацию одобрена! Вы назначены в ${district ? district.name : 'район'}.`,
        data: {
          approvalId: approval.id,
          mruId,
          districtId
        }
      });

      res.json({
        success: true,
        message: 'Заявка одобрена, офицер зарегистрирован',
        data: {
          approval,
          user: newUser
        }
      });
    } else if (approval.type === 'client') {
      // Создаем клиента
      const clientData = approval.data;
      const newClient = await Client.create({
        ...clientData,
        status: 'active'
      });

      // Обновляем заявку
      await approval.update({
        status: 'approved',
        reviewerId: req.user.id,
        reviewedAt: new Date(),
        targetId: newClient.id
      });

      // Уведомление офицеру
      await Notification.create({
        userId: clientData.officerId,
        type: 'client_approved',
        title: 'Клиент одобрен',
        message: `Клиент ${clientData.fullName} успешно добавлен в систему.`,
        data: {
          approvalId: approval.id,
          clientId: newClient.id
        }
      });

      res.json({
        success: true,
        message: 'Заявка одобрена, клиент создан',
        data: {
          approval,
          client: newClient
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Отклонить заявку
// @route   POST /api/approvals/:id/reject
// @access  Private (central_admin)
exports.rejectApproval = async (req, res, next) => {
  try {
    const approval = await PendingApproval.findByPk(req.params.id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Заявка уже рассмотрена'
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать причину отклонения'
      });
    }

    await approval.update({
      status: 'rejected',
      reviewerId: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason
    });

    // Уведомление заявителю
    await Notification.create({
      userId: approval.requesterId,
      type: 'rejection',
      title: 'Заявка отклонена',
      message: `Ваша заявка отклонена. Причина: ${reason}`,
      data: {
        approvalId: approval.id,
        reason
      }
    });

    res.json({
      success: true,
      message: 'Заявка отклонена',
      data: approval
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создать заявку на регистрацию офицера
// @route   POST /api/approvals/officer
// @access  Public
exports.createOfficerApproval = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем заявку
    const approval = await PendingApproval.create({
      type: 'officer',
      status: 'pending',
      requesterId: req.user?.id || null, // Если это self-registration, requesterId может быть null
      data: {
        fullName,
        email,
        phone,
        password // Пароль будет хеширован при создании пользователя
      }
    });

    res.status(201).json({
      success: true,
      message: 'Заявка на регистрацию отправлена. Ожидайте одобрения администратора.',
      data: approval
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Создать заявку на добавление клиента
// @route   POST /api/approvals/client
// @access  Private (officer)
exports.createClientApproval = async (req, res, next) => {
  try {
    const clientData = req.body;

    // Добавляем officerId из текущего пользователя
    clientData.officerId = req.user.id;

    // Создаем заявку
    const approval = await PendingApproval.create({
      type: 'client',
      status: 'pending',
      requesterId: req.user.id,
      data: clientData
    });

    res.status(201).json({
      success: true,
      message: 'Заявка на добавление клиента отправлена. Ожидайте одобрения администратора.',
      data: approval
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
