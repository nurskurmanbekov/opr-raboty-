const { Client, User, ClientAssignmentHistory, District, MRU, Notification } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Переназначить клиента другому офицеру
// @route   POST /api/clients/:clientId/reassign
// @access  Private (central_admin)
exports.reassignClient = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { clientId } = req.params;
    const { newOfficerId, reason } = req.body;

    if (!newOfficerId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать нового офицера (newOfficerId)'
      });
    }

    // Получаем клиента с текущим офицером
    const client = await Client.findByPk(clientId, {
      include: [
        {
          model: User,
          as: 'officer',
          include: [
            {
              model: District,
              as: 'assignedDistrict',
              include: [{ model: MRU, as: 'mru' }]
            }
          ]
        }
      ],
      transaction
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Клиент не найден'
      });
    }

    // Получаем нового офицера
    const newOfficer = await User.findByPk(newOfficerId, {
      include: [
        {
          model: District,
          as: 'assignedDistrict',
          include: [{ model: MRU, as: 'mru' }]
        }
      ],
      transaction
    });

    if (!newOfficer || newOfficer.role !== 'officer') {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Новый офицер не найден или не является офицером'
      });
    }

    // Проверка: нельзя переназначить самому себе
    if (client.officerId === newOfficerId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Клиент уже назначен этому офицеру'
      });
    }

    const previousOfficer = client.officer;

    // Сохраняем историю переназначения
    await ClientAssignmentHistory.create({
      clientId: client.id,
      previousOfficerId: previousOfficer?.id || null,
      previousOfficerName: previousOfficer?.fullName || 'Не назначен',
      previousDistrictId: previousOfficer?.districtId || null,
      previousDistrictName: previousOfficer?.assignedDistrict?.name || null,
      previousMruId: previousOfficer?.assignedDistrict?.mruId || null,
      previousMruName: previousOfficer?.assignedDistrict?.mru?.name || null,
      newOfficerId: newOfficer.id,
      newOfficerName: newOfficer.fullName,
      newDistrictId: newOfficer.districtId || null,
      newDistrictName: newOfficer.assignedDistrict?.name || null,
      newMruId: newOfficer.assignedDistrict?.mruId || null,
      newMruName: newOfficer.assignedDistrict?.mru?.name || null,
      reason: reason || 'Переназначение администратором',
      reassignedBy: req.user.id,
      reassignedByName: req.user.fullName
    }, { transaction });

    // Обновляем клиента
    await client.update({
      officerId: newOfficerId,
      district: newOfficer.assignedDistrict?.name || client.district
    }, { transaction });

    // Уведомления

    // Уведомление старому офицеру
    if (previousOfficer) {
      await Notification.create({
        userId: previousOfficer.id,
        type: 'client_reassigned',
        title: 'Клиент переназначен',
        message: `Клиент ${client.fullName} переназначен офицеру ${newOfficer.fullName}. Причина: ${reason || 'не указана'}`,
        data: {
          clientId: client.id,
          clientName: client.fullName,
          newOfficerId: newOfficer.id,
          newOfficerName: newOfficer.fullName,
          reason
        }
      }, { transaction });
    }

    // Уведомление новому офицеру
    await Notification.create({
      userId: newOfficer.id,
      type: 'client_assigned',
      title: 'Новый клиент назначен',
      message: `Вам назначен клиент ${client.fullName}. Срок: ${client.assignedHours} часов, осталось: ${client.assignedHours - client.completedHours} часов.`,
      data: {
        clientId: client.id,
        clientName: client.fullName,
        assignedHours: client.assignedHours,
        completedHours: client.completedHours,
        previousOfficerId: previousOfficer?.id,
        previousOfficerName: previousOfficer?.fullName,
        reason
      }
    }, { transaction });

    await transaction.commit();

    // Получаем обновленного клиента с новыми данными
    const updatedClient = await Client.findByPk(clientId, {
      include: [
        {
          model: User,
          as: 'officer',
          include: [
            {
              model: District,
              as: 'assignedDistrict',
              include: [{ model: MRU, as: 'mru' }]
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Клиент успешно переназначен',
      data: {
        client: updatedClient,
        previousOfficer: {
          id: previousOfficer?.id,
          fullName: previousOfficer?.fullName,
          district: previousOfficer?.assignedDistrict?.name,
          mru: previousOfficer?.assignedDistrict?.mru?.name
        },
        newOfficer: {
          id: newOfficer.id,
          fullName: newOfficer.fullName,
          district: newOfficer.assignedDistrict?.name,
          mru: newOfficer.assignedDistrict?.mru?.name
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Получить историю переназначений клиента
// @route   GET /api/clients/:clientId/assignment-history
// @access  Private
exports.getClientAssignmentHistory = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Клиент не найден'
      });
    }

    const history = await ClientAssignmentHistory.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: history.length,
      data: {
        client: {
          id: client.id,
          fullName: client.fullName
        },
        history
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Массовое переназначение клиентов (при увольнении офицера)
// @route   POST /api/officers/:officerId/reassign-all-clients
// @access  Private (central_admin)
exports.reassignAllClients = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { officerId } = req.params;
    const { newOfficerId, reason } = req.body;

    if (!newOfficerId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать нового офицера (newOfficerId)'
      });
    }

    // Получаем старого офицера
    const oldOfficer = await User.findByPk(officerId, {
      include: [
        {
          model: District,
          as: 'assignedDistrict',
          include: [{ model: MRU, as: 'mru' }]
        }
      ],
      transaction
    });

    if (!oldOfficer) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Офицер не найден'
      });
    }

    // Получаем нового офицера
    const newOfficer = await User.findByPk(newOfficerId, {
      include: [
        {
          model: District,
          as: 'assignedDistrict',
          include: [{ model: MRU, as: 'mru' }]
        }
      ],
      transaction
    });

    if (!newOfficer || newOfficer.role !== 'officer') {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Новый офицер не найден или не является офицером'
      });
    }

    // Получаем всех клиентов старого офицера
    const clients = await Client.findAll({
      where: { officerId },
      transaction
    });

    if (clients.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'У этого офицера нет клиентов для переназначения'
      });
    }

    const reassignmentReason = reason || `Массовое переназначение при увольнении офицера ${oldOfficer.fullName}`;

    // Переназначаем всех клиентов
    for (const client of clients) {
      // Сохраняем историю
      await ClientAssignmentHistory.create({
        clientId: client.id,
        previousOfficerId: oldOfficer.id,
        previousOfficerName: oldOfficer.fullName,
        previousDistrictId: oldOfficer.districtId || null,
        previousDistrictName: oldOfficer.assignedDistrict?.name || null,
        previousMruId: oldOfficer.assignedDistrict?.mruId || null,
        previousMruName: oldOfficer.assignedDistrict?.mru?.name || null,
        newOfficerId: newOfficer.id,
        newOfficerName: newOfficer.fullName,
        newDistrictId: newOfficer.districtId || null,
        newDistrictName: newOfficer.assignedDistrict?.name || null,
        newMruId: newOfficer.assignedDistrict?.mruId || null,
        newMruName: newOfficer.assignedDistrict?.mru?.name || null,
        reason: reassignmentReason,
        reassignedBy: req.user.id,
        reassignedByName: req.user.fullName
      }, { transaction });

      // Обновляем клиента
      await client.update({
        officerId: newOfficerId,
        district: newOfficer.assignedDistrict?.name || client.district
      }, { transaction });
    }

    // Уведомление новому офицеру
    await Notification.create({
      userId: newOfficer.id,
      type: 'clients_assigned',
      title: 'Назначены новые клиенты',
      message: `Вам назначено ${clients.length} клиентов от офицера ${oldOfficer.fullName}. Причина: ${reassignmentReason}`,
      data: {
        previousOfficerId: oldOfficer.id,
        previousOfficerName: oldOfficer.fullName,
        clientsCount: clients.length,
        reason: reassignmentReason
      }
    }, { transaction });

    // Деактивируем старого офицера (опционально)
    // await oldOfficer.update({ isActive: false }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Успешно переназначено ${clients.length} клиентов`,
      data: {
        reassignedCount: clients.length,
        previousOfficer: {
          id: oldOfficer.id,
          fullName: oldOfficer.fullName,
          district: oldOfficer.assignedDistrict?.name,
          mru: oldOfficer.assignedDistrict?.mru?.name
        },
        newOfficer: {
          id: newOfficer.id,
          fullName: newOfficer.fullName,
          district: newOfficer.assignedDistrict?.name,
          mru: newOfficer.assignedDistrict?.mru?.name
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = exports;
