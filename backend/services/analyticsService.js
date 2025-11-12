const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const WorkSession = require('../models/WorkSession');
const Client = require('../models/Client');
const User = require('../models/User');
const Photo = require('../models/Photo');
const GeofenceViolation = require('../models/GeofenceViolation');
const LocationHistory = require('../models/LocationHistory');

class AnalyticsService {
  /**
   * Get overall statistics
   */
  async getOverallStats(filters = {}) {
    try {
      const { startDate, endDate, district, districtId, mruId, officerId } = filters;

      const whereClient = {};
      const whereSession = {};
      const includeOfficer = [];

      // Поддержка старого параметра district (STRING) для обратной совместимости
      if (district) whereClient.district = district;

      // Новый способ - фильтрация по districtId или mruId через officer
      if (districtId || mruId) {
        const whereOfficer = {};
        if (districtId) whereOfficer.districtId = districtId;
        if (mruId) whereOfficer.mruId = mruId;
        includeOfficer.push({
          model: User,
          as: 'officer',
          where: whereOfficer,
          attributes: [],
          required: true
        });
      }

      if (officerId) whereClient.officerId = officerId;

      if (startDate && endDate) {
        whereSession.startTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Total clients
      const totalClients = await Client.count({
        where: whereClient,
        include: includeOfficer,
        distinct: true
      });

      // Active clients (with at least one work session)
      const activeClients = await Client.count({
        where: whereClient,
        include: [
          ...includeOfficer,
          {
            model: WorkSession,
            as: 'workSessions',
            where: whereSession,
            required: true
          }
        ],
        distinct: true
      });

      // Total work sessions
      const totalSessions = await WorkSession.count({
        where: whereSession,
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          include: includeOfficer,
          required: true
        }]
      });

      // Work sessions by status
      const sessionsByStatus = await WorkSession.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('WorkSession.id')), 'count']
        ],
        where: whereSession,
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          include: includeOfficer,
          attributes: []
        }],
        group: ['status'],
        raw: true
      });

      // Total work hours
      const completedSessions = await WorkSession.findAll({
        where: {
          ...whereSession,
          status: 'completed',
          endTime: { [Op.ne]: null }
        },
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          include: includeOfficer,
          attributes: []
        }],
        attributes: ['startTime', 'endTime']
      });

      let totalHours = 0;
      completedSessions.forEach(session => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const hours = (end - start) / (1000 * 60 * 60);
        totalHours += hours;
      });

      // Geofence violations
      const totalViolations = await GeofenceViolation.count({
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          include: includeOfficer,
          required: true
        }]
      });

      return {
        success: true,
        data: {
          clients: {
            total: totalClients,
            active: activeClients,
            inactive: totalClients - activeClients
          },
          workSessions: {
            total: totalSessions,
            byStatus: sessionsByStatus.reduce((acc, item) => {
              acc[item.status] = parseInt(item.count);
              return acc;
            }, {}),
            totalHours: Math.round(totalHours * 100) / 100
          },
          violations: {
            total: totalViolations
          }
        }
      };

    } catch (error) {
      console.error('Get overall stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client performance analytics
   */
  async getClientPerformance(clientId, startDate, endDate) {
    try {
      const where = { clientId };
      if (startDate && endDate) {
        where.startTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Total sessions
      const totalSessions = await WorkSession.count({ where });

      // Sessions by status
      const sessionsByStatus = await WorkSession.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      });

      // Completion rate
      const completedCount = sessionsByStatus.find(s => s.status === 'completed')?.count || 0;
      const completionRate = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;

      // Average work hours per session
      const completedSessions = await WorkSession.findAll({
        where: {
          ...where,
          status: 'completed',
          endTime: { [Op.ne]: null }
        },
        attributes: ['startTime', 'endTime']
      });

      let totalHours = 0;
      completedSessions.forEach(session => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        totalHours += (end - start) / (1000 * 60 * 60);
      });

      const avgHoursPerSession = completedSessions.length > 0
        ? totalHours / completedSessions.length
        : 0;

      // Violations
      const violations = await GeofenceViolation.count({
        where: { clientId }
      });

      // Photo verification rate
      const photosTotal = await Photo.count({
        include: [{
          model: WorkSession,
          as: 'workSession',
          where: { clientId },
          required: true
        }]
      });

      const photosVerified = await Photo.count({
        where: { verificationStatus: 'verified' },
        include: [{
          model: WorkSession,
          as: 'workSession',
          where: { clientId },
          required: true
        }]
      });

      const photoVerificationRate = photosTotal > 0
        ? (photosVerified / photosTotal) * 100
        : 0;

      return {
        success: true,
        data: {
          totalSessions,
          sessionsByStatus: sessionsByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {}),
          completionRate: Math.round(completionRate * 100) / 100,
          avgHoursPerSession: Math.round(avgHoursPerSession * 100) / 100,
          totalWorkHours: Math.round(totalHours * 100) / 100,
          violations,
          photoStats: {
            total: photosTotal,
            verified: photosVerified,
            verificationRate: Math.round(photoVerificationRate * 100) / 100
          }
        }
      };

    } catch (error) {
      console.error('Get client performance error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get officer performance analytics
   */
  async getOfficerPerformance(officerId, startDate, endDate) {
    try {
      // Total clients
      const totalClients = await Client.count({
        where: { officerId }
      });

      // Active clients (with sessions in date range)
      const clientWhere = { officerId };
      const sessionWhere = {};

      if (startDate && endDate) {
        sessionWhere.startTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const activeClients = await Client.count({
        where: clientWhere,
        include: [{
          model: WorkSession,
          as: 'workSessions',
          where: sessionWhere,
          required: true
        }],
        distinct: true
      });

      // Work sessions verified
      const sessionsVerified = await WorkSession.count({
        where: {
          verifiedBy: officerId,
          ...(startDate && endDate ? {
            verifiedAt: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          } : {})
        }
      });

      // Average verification time (time between session end and verification)
      const verifiedSessions = await WorkSession.findAll({
        where: {
          verifiedBy: officerId,
          verifiedAt: { [Op.ne]: null },
          endTime: { [Op.ne]: null },
          ...(startDate && endDate ? {
            verifiedAt: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          } : {})
        },
        attributes: ['endTime', 'verifiedAt']
      });

      let totalVerificationTime = 0;
      verifiedSessions.forEach(session => {
        const end = new Date(session.endTime);
        const verified = new Date(session.verifiedAt);
        totalVerificationTime += (verified - end) / (1000 * 60 * 60); // hours
      });

      const avgVerificationTime = verifiedSessions.length > 0
        ? totalVerificationTime / verifiedSessions.length
        : 0;

      return {
        success: true,
        data: {
          clients: {
            total: totalClients,
            active: activeClients,
            inactive: totalClients - activeClients
          },
          sessionsVerified,
          avgVerificationTimeHours: Math.round(avgVerificationTime * 100) / 100
        }
      };

    } catch (error) {
      console.error('Get officer performance error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get district statistics
   */
  async getDistrictStats(district, startDate, endDate) {
    try {
      const whereClient = { district };
      const whereSession = {};

      if (startDate && endDate) {
        whereSession.startTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Total clients in district
      const totalClients = await Client.count({ where: whereClient });

      // Total officers in district
      const totalOfficers = await User.count({
        where: {
          district,
          role: 'officer',
          isActive: true
        }
      });

      // Total work sessions
      const totalSessions = await WorkSession.count({
        where: whereSession,
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          required: true
        }]
      });

      // Completion rate
      const completedSessions = await WorkSession.count({
        where: {
          ...whereSession,
          status: 'completed'
        },
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          required: true
        }]
      });

      const completionRate = totalSessions > 0
        ? (completedSessions / totalSessions) * 100
        : 0;

      // Violations
      const totalViolations = await GeofenceViolation.count({
        include: [{
          model: Client,
          as: 'client',
          where: whereClient,
          required: true
        }]
      });

      return {
        success: true,
        data: {
          district,
          clients: totalClients,
          officers: totalOfficers,
          workSessions: {
            total: totalSessions,
            completed: completedSessions,
            completionRate: Math.round(completionRate * 100) / 100
          },
          violations: totalViolations
        }
      };

    } catch (error) {
      console.error('Get district stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(type, filters = {}) {
    try {
      const { startDate, endDate, district, clientId } = filters;

      let data = [];

      switch (type) {
        case 'sessions_by_day':
          data = await this.getSessionsByDay(startDate, endDate, district, clientId);
          break;

        case 'hours_by_day':
          data = await this.getHoursByDay(startDate, endDate, district, clientId);
          break;

        case 'violations_by_day':
          data = await this.getViolationsByDay(startDate, endDate, district, clientId);
          break;

        default:
          return { success: false, error: `Unknown time series type: ${type}` };
      }

      return { success: true, data };

    } catch (error) {
      console.error('Get time series data error:', error);
      return { success: false, error: error.message };
    }
  }

  async getSessionsByDay(startDate, endDate, district, clientId) {
    const whereClient = {};
    const whereSession = {};

    if (district) whereClient.district = district;
    if (clientId) whereSession.clientId = clientId;

    if (startDate && endDate) {
      whereSession.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const sessions = await WorkSession.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startTime')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('WorkSession.id')), 'count']
      ],
      where: whereSession,
      include: district ? [{
        model: Client,
        as: 'client',
        where: whereClient,
        attributes: []
      }] : [],
      group: [sequelize.fn('DATE', sequelize.col('startTime'))],
      order: [[sequelize.fn('DATE', sequelize.col('startTime')), 'ASC']],
      raw: true
    });

    return sessions.map(s => ({
      date: s.date,
      count: parseInt(s.count)
    }));
  }

  async getHoursByDay(startDate, endDate, district, clientId) {
    const whereClient = {};
    const whereSession = {
      status: 'completed',
      endTime: { [Op.ne]: null }
    };

    if (district) whereClient.district = district;
    if (clientId) whereSession.clientId = clientId;

    if (startDate && endDate) {
      whereSession.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const sessions = await WorkSession.findAll({
      where: whereSession,
      include: district ? [{
        model: Client,
        as: 'client',
        where: whereClient,
        attributes: []
      }] : [],
      attributes: ['startTime', 'endTime'],
      raw: true
    });

    // Group by date and calculate total hours
    const hoursByDate = {};

    sessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      const hours = (end - start) / (1000 * 60 * 60);

      if (!hoursByDate[date]) {
        hoursByDate[date] = 0;
      }
      hoursByDate[date] += hours;
    });

    return Object.keys(hoursByDate).sort().map(date => ({
      date,
      hours: Math.round(hoursByDate[date] * 100) / 100
    }));
  }

  async getViolationsByDay(startDate, endDate, district, clientId) {
    const whereClient = {};
    const whereViolation = {};

    if (district) whereClient.district = district;
    if (clientId) whereViolation.clientId = clientId;

    if (startDate && endDate) {
      whereViolation.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const violations = await GeofenceViolation.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('GeofenceViolation.id')), 'count']
      ],
      where: whereViolation,
      include: district ? [{
        model: Client,
        as: 'client',
        where: whereClient,
        attributes: []
      }] : [],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']],
      raw: true
    });

    return violations.map(v => ({
      date: v.date,
      count: parseInt(v.count)
    }));
  }
}

module.exports = new AnalyticsService();
