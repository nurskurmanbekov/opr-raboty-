const analyticsService = require('../services/analyticsService');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const WorkSession = require('../models/WorkSession');
const Client = require('../models/Client');

/**
 * Get overall statistics
 */
exports.getOverallStats = async (req, res) => {
  try {
    const { startDate, endDate, district, districtId, mruId, officerId } = req.query;

    const result = await analyticsService.getOverallStats({
      startDate,
      endDate,
      district, // Поддержка старого параметра для обратной совместимости
      districtId,
      mruId,
      officerId
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

/**
 * Get client performance
 */
exports.getClientPerformance = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await analyticsService.getClientPerformance(
      clientId,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching client performance',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get client performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client performance',
      error: error.message
    });
  }
};

/**
 * Get officer performance
 */
exports.getOfficerPerformance = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await analyticsService.getOfficerPerformance(
      officerId,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching officer performance',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get officer performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching officer performance',
      error: error.message
    });
  }
};

/**
 * Get district statistics
 */
exports.getDistrictStats = async (req, res) => {
  try {
    const { district } = req.params;
    const { startDate, endDate } = req.query;

    const result = await analyticsService.getDistrictStats(
      district,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching district statistics',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get district stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching district statistics',
      error: error.message
    });
  }
};

/**
 * Get time series data
 */
exports.getTimeSeriesData = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, district, clientId } = req.query;

    const result = await analyticsService.getTimeSeriesData(type, {
      startDate,
      endDate,
      district,
      clientId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get time series data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time series data',
      error: error.message
    });
  }
};

/**
 * Export report to Excel
 */
exports.exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate, district } = req.query;

    // Fetch data
    const statsResult = await analyticsService.getOverallStats({
      startDate,
      endDate,
      district
    });

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error generating report'
      });
    }

    // Fetch work sessions
    const whereClient = {};
    const whereSession = {};

    if (district) whereClient.district = district;
    if (startDate && endDate) {
      whereSession.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const sessions = await WorkSession.findAll({
      where: whereSession,
      include: [{
        model: Client,
        as: 'client',
        where: whereClient
      }],
      order: [['startTime', 'DESC']],
      limit: 1000
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    const stats = statsResult.data;
    summarySheet.addRows([
      { metric: 'Total Clients', value: stats.clients.total },
      { metric: 'Active Clients', value: stats.clients.active },
      { metric: 'Total Work Sessions', value: stats.workSessions.total },
      { metric: 'Completed Sessions', value: stats.workSessions.byStatus.completed || 0 },
      { metric: 'Pending Sessions', value: stats.workSessions.byStatus.pending || 0 },
      { metric: 'Total Work Hours', value: stats.workSessions.totalHours },
      { metric: 'Total Violations', value: stats.violations.total }
    ]);

    // Sessions sheet
    const sessionsSheet = workbook.addWorksheet('Work Sessions');
    sessionsSheet.columns = [
      { header: 'Client Name', key: 'clientName', width: 30 },
      { header: 'Start Time', key: 'startTime', width: 20 },
      { header: 'End Time', key: 'endTime', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Work Location', key: 'workLocation', width: 30 }
    ];

    sessions.forEach(session => {
      sessionsSheet.addRow({
        clientName: session.client.fullName,
        startTime: session.startTime,
        endTime: session.endTime || 'N/A',
        status: session.status,
        workLocation: session.workLocation
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=probation-report-${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting to Excel',
      error: error.message
    });
  }
};

/**
 * Export report to PDF
 */
exports.exportToPDF = async (req, res) => {
  try {
    const { startDate, endDate, district } = req.query;

    // Fetch data
    const statsResult = await analyticsService.getOverallStats({
      startDate,
      endDate,
      district
    });

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error generating report'
      });
    }

    const stats = statsResult.data;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=probation-report-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Probation Monitoring System Report', { align: 'center' });
    doc.moveDown();

    // Date range
    if (startDate && endDate) {
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    }
    if (district) {
      doc.text(`District: ${district}`, { align: 'center' });
    }
    doc.moveDown(2);

    // Statistics
    doc.fontSize(16).text('Overall Statistics', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Total Clients: ${stats.clients.total}`);
    doc.text(`Active Clients: ${stats.clients.active}`);
    doc.text(`Inactive Clients: ${stats.clients.inactive}`);
    doc.moveDown();

    doc.text(`Total Work Sessions: ${stats.workSessions.total}`);
    doc.text(`Completed Sessions: ${stats.workSessions.byStatus.completed || 0}`);
    doc.text(`Pending Sessions: ${stats.workSessions.byStatus.pending || 0}`);
    doc.text(`Rejected Sessions: ${stats.workSessions.byStatus.rejected || 0}`);
    doc.moveDown();

    doc.text(`Total Work Hours: ${stats.workSessions.totalHours} hours`);
    doc.moveDown();

    doc.text(`Total Geofence Violations: ${stats.violations.total}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).text(
      `Generated on: ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Export to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting to PDF',
      error: error.message
    });
  }
};
