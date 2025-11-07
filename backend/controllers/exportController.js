const ExcelJS = require('exceljs');
const { Client, User, WorkSession, MRU, District } = require('../models');
const { Op } = require('sequelize');

// @desc    Экспорт общей статистики в Excel
// @route   GET /api/export/statistics/excel
// @access  Private (auditor, central_admin, mru_manager, district_manager)
exports.exportStatisticsToExcel = async (req, res, next) => {
  try {
    const user = req.user;
    const auditorAccess = req.auditorAccess;

    // Создаем книгу Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Probation System';
    workbook.created = new Date();

    // Лист 1: Общая статистика
    const summarySheet = workbook.addWorksheet('Общая статистика');

    summarySheet.columns = [
      { header: 'Показатель', key: 'metric', width: 40 },
      { header: 'Значение', key: 'value', width: 20 }
    ];

    // Получаем статистику
    let whereClause = {};

    // Фильтрация для разных ролей
    if (user.role === 'auditor' && auditorAccess) {
      if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
        const districts = await District.findAll({
          where: { mruId: auditorAccess.allowedMruIds },
          attributes: ['id']
        });
        const districtIds = districts.map(d => d.id);
        const officers = await User.findAll({
          where: { districtId: districtIds, role: 'officer' },
          attributes: ['id']
        });
        whereClause.officerId = officers.map(o => o.id);
      } else if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
        const officers = await User.findAll({
          where: { districtId: auditorAccess.allowedDistrictIds, role: 'officer' },
          attributes: ['id']
        });
        whereClause.officerId = officers.map(o => o.id);
      }
    } else if (user.role === 'mru_manager') {
      const districts = await District.findAll({
        where: { mruId: user.mruId },
        attributes: ['id']
      });
      const districtIds = districts.map(d => d.id);
      const officers = await User.findAll({
        where: { districtId: districtIds, role: 'officer' },
        attributes: ['id']
      });
      whereClause.officerId = officers.map(o => o.id);
    } else if (user.role === 'district_manager') {
      const officers = await User.findAll({
        where: { districtId: user.districtId, role: 'officer' },
        attributes: ['id']
      });
      whereClause.officerId = officers.map(o => o.id);
    }

    const [
      totalClients,
      activeClients,
      completedClients,
      totalHoursWorked
    ] = await Promise.all([
      Client.count({ where: whereClause }),
      Client.count({ where: { ...whereClause, status: 'active' } }),
      Client.count({ where: { ...whereClause, status: 'completed' } }),
      Client.sum('completedHours', { where: whereClause })
    ]);

    summarySheet.addRows([
      { metric: 'Всего клиентов', value: totalClients || 0 },
      { metric: 'Активных клиентов', value: activeClients || 0 },
      { metric: 'Завершивших программу', value: completedClients || 0 },
      { metric: 'Отработано часов (всего)', value: Math.round(totalHoursWorked || 0) }
    ]);

    // Стилизация заголовков
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };

    // Лист 2: Статистика по районам
    const districtSheet = workbook.addWorksheet('По районам');

    districtSheet.columns = [
      { header: 'Район', key: 'district', width: 30 },
      { header: 'Город', key: 'city', width: 20 },
      { header: 'МРУ', key: 'mru', width: 25 },
      { header: 'Офицеров', key: 'officers', width: 15 },
      { header: 'Клиентов', key: 'clients', width: 15 },
      { header: 'Отработано часов', key: 'hours', width: 20 }
    ];

    let districtFilter = {};
    if (user.role === 'auditor' && auditorAccess) {
      if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
        districtFilter.mruId = auditorAccess.allowedMruIds;
      } else if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
        districtFilter.id = auditorAccess.allowedDistrictIds;
      }
    } else if (user.role === 'mru_manager') {
      districtFilter.mruId = user.mruId;
    } else if (user.role === 'district_manager') {
      districtFilter.id = user.districtId;
    }

    const districts = await District.findAll({
      where: { ...districtFilter, isActive: true },
      include: [{ model: MRU, as: 'mru', attributes: ['name'] }]
    });

    for (const district of districts) {
      const officers = await User.findAll({
        where: { districtId: district.id, role: 'officer', isActive: true },
        attributes: ['id']
      });
      const officerIds = officers.map(o => o.id);

      const [clientsCount, totalHours] = await Promise.all([
        Client.count({ where: { officerId: officerIds } }),
        Client.sum('completedHours', { where: { officerId: officerIds } })
      ]);

      districtSheet.addRow({
        district: district.name,
        city: district.city,
        mru: district.mru?.name || '-',
        officers: officers.length,
        clients: clientsCount || 0,
        hours: Math.round(totalHours || 0)
      });
    }

    districtSheet.getRow(1).font = { bold: true, size: 12 };
    districtSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };

    // Устанавливаем headers для скачивания файла
    const filename = `statistika-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Экспорт списка клиентов в Excel
// @route   GET /api/export/clients/excel
// @access  Private (auditor, central_admin, mru_manager, district_manager, officer)
exports.exportClientsToExcel = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, districtId, mruId } = req.query;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    // Фильтрация по роли
    if (user.role === 'officer') {
      whereClause.officerId = user.id;
    } else if (user.role === 'district_manager') {
      const officers = await User.findAll({
        where: { districtId: user.districtId, role: 'officer' },
        attributes: ['id']
      });
      whereClause.officerId = officers.map(o => o.id);
    } else if (user.role === 'mru_manager') {
      const districts = await District.findAll({
        where: { mruId: user.mruId },
        attributes: ['id']
      });
      const districtIds = districts.map(d => d.id);
      const officers = await User.findAll({
        where: { districtId: districtIds, role: 'officer' },
        attributes: ['id']
      });
      whereClause.officerId = officers.map(o => o.id);
    }

    const clients = await Client.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'officer',
          attributes: ['fullName', 'phone'],
          include: [
            {
              model: District,
              as: 'assignedDistrict',
              attributes: ['name', 'city'],
              include: [
                {
                  model: MRU,
                  as: 'mru',
                  attributes: ['name']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Клиенты');

    sheet.columns = [
      { header: 'ФИО', key: 'fullName', width: 30 },
      { header: 'Телефон', key: 'phone', width: 20 },
      { header: 'Район', key: 'district', width: 25 },
      { header: 'Офицер', key: 'officer', width: 30 },
      { header: 'Назначено часов', key: 'assignedHours', width: 18 },
      { header: 'Отработано часов', key: 'completedHours', width: 20 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата начала', key: 'startDate', width: 15 }
    ];

    clients.forEach(client => {
      sheet.addRow({
        fullName: client.fullName,
        phone: client.phone || '-',
        district: client.officer?.assignedDistrict?.name || '-',
        officer: client.officer?.fullName || '-',
        assignedHours: client.assignedHours,
        completedHours: client.completedHours,
        status: client.status === 'active' ? 'Активный' : client.status === 'completed' ? 'Завершен' : client.status,
        startDate: client.startDate ? new Date(client.startDate).toLocaleDateString('ru-RU') : '-'
      });
    });

    // Стилизация
    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };

    const filename = `klienty-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
