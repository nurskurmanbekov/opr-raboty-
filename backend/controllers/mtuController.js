const { MTULocation, ClientMTUAssignment, Client, User } = require('../models');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const {
  calculateSquareBounds,
  validateSquareBounds,
  isInSquare,
  formatCoordinates
} = require('../utils/squareGeofence');

/**
 * @desc    Create new MTU location with QR code and PDF
 * @route   POST /api/mtu/create
 * @access  Private (superadmin only)
 */
exports.createMTU = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only superadmin can create MTU locations
    if (currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can create MTU locations'
      });
    }

    const {
      name,
      district,
      address,
      geofence_center_lat,
      geofence_center_lon,
      geofence_size
    } = req.body;

    // Validate required fields
    if (!name || !district || !geofence_center_lat || !geofence_center_lon || !geofence_size) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, district, geofence_center_lat, geofence_center_lon, geofence_size'
      });
    }

    // Validate geofence size (50-1000 meters)
    if (geofence_size < 50 || geofence_size > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Geofence size must be between 50 and 1000 meters'
      });
    }

    // Calculate square boundaries
    const bounds = calculateSquareBounds(
      parseFloat(geofence_center_lat),
      parseFloat(geofence_center_lon),
      parseInt(geofence_size)
    );

    // Validate boundaries
    const validation = validateSquareBounds(bounds);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid geofence boundaries: ${validation.error}`
      });
    }

    // Generate unique MTU code
    const mtuCode = `MTU_${district.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;

    // Create MTU record (without QR data first)
    const mtu = await MTULocation.create({
      mtuCode,
      name,
      district,
      address,
      geofenceType: 'square',
      geofenceCenterLat: parseFloat(geofence_center_lat),
      geofenceCenterLon: parseFloat(geofence_center_lon),
      geofenceSize: parseInt(geofence_size),
      geofenceNorth: bounds.north,
      geofenceSouth: bounds.south,
      geofenceEast: bounds.east,
      geofenceWest: bounds.west,
      status: 'active'
    });

    // Prepare QR code data
    const qrData = {
      type: 'mtu_checkin',
      mtu_id: mtu.id,
      mtu_code: mtuCode,
      name: name,
      district: district
    };

    // Ensure directories exist
    const qrDir = path.join(__dirname, '../uploads/qr-codes');
    const pdfDir = path.join(__dirname, '../uploads/pdf');

    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Generate QR code image
    const qrFileName = `${mtuCode}.png`;
    const qrFilePath = path.join(qrDir, qrFileName);

    await QRCode.toFile(qrFilePath, JSON.stringify(qrData), {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate PDF with QR code and instructions
    const pdfFileName = `${mtuCode}.pdf`;
    const pdfFilePath = path.join(pdfDir, pdfFileName);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const writeStream = fs.createWriteStream(pdfFilePath);
    doc.pipe(writeStream);

    // PDF Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('МЕСТО ОБЩЕСТВЕННЫХ РАБОТ', { align: 'center' });

    doc.moveDown();
    doc.fontSize(18)
       .font('Helvetica')
       .text('МТУ - Место Труда Участника', { align: 'center' });

    doc.moveDown(2);

    // MTU Details
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(`Название: `, { continued: true })
       .font('Helvetica')
       .text(name);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold')
       .text(`Код МТУ: `, { continued: true })
       .font('Helvetica')
       .text(mtuCode);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold')
       .text(`Район: `, { continued: true })
       .font('Helvetica')
       .text(district);

    if (address) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold')
         .text(`Адрес: `, { continued: true })
         .font('Helvetica')
         .text(address);
    }

    doc.moveDown(2);

    // QR Code
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('QR КОД ДЛЯ НАЧАЛА РАБОТЫ', { align: 'center' });

    doc.moveDown();

    // Add QR code image to PDF
    const qrImageWidth = 300;
    const qrImageX = (doc.page.width - qrImageWidth) / 2;
    doc.image(qrFilePath, qrImageX, doc.y, { width: qrImageWidth });

    doc.moveDown(8);

    // Instructions
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('ИНСТРУКЦИЯ ДЛЯ КЛИЕНТОВ:', { underline: true });

    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .list([
         'Откройте мобильное приложение "Probation System"',
         'Нажмите на кнопку "Начать работу"',
         'Отсканируйте QR код выше',
         'Пройдите проверку лица (Face ID)',
         'Убедитесь, что находитесь в пределах геозоны',
         'После завершения работы - загрузите фото и описание'
       ], {
         bulletRadius: 2,
         textIndent: 20
       });

    doc.moveDown(2);

    // Geofence info
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Геозона: ')
       .font('Helvetica')
       .text(`Квадратная зона ${geofence_size} метров`);

    doc.fontSize(10)
       .text(`Центр: ${formatCoordinates(geofence_center_lat, geofence_center_lon)}`);

    // Footer
    doc.moveDown(2);
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text('Департамент пробации Кыргызской Республики', { align: 'center' });
    doc.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Update MTU with QR and PDF URLs
    await mtu.update({
      qrCodeData: JSON.stringify(qrData),
      qrCodeImageUrl: `/uploads/qr-codes/${qrFileName}`,
      qrPdfUrl: `/uploads/pdf/${pdfFileName}`
    });

    console.log(`✅ MTU created: ${mtuCode} with QR code and PDF`);

    res.status(201).json({
      success: true,
      message: 'MTU location created successfully',
      data: {
        id: mtu.id,
        mtu_code: mtuCode,
        name: mtu.name,
        district: mtu.district,
        qr_code_url: mtu.qrCodeImageUrl,
        qr_pdf_url: mtu.qrPdfUrl,
        geofence: {
          center: {
            lat: mtu.geofenceCenterLat,
            lon: mtu.geofenceCenterLon
          },
          size: mtu.geofenceSize,
          bounds: {
            north: mtu.geofenceNorth,
            south: mtu.geofenceSouth,
            east: mtu.geofenceEast,
            west: mtu.geofenceWest
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating MTU:', error);
    next(error);
  }
};

/**
 * @desc    Get all MTU locations
 * @route   GET /api/mtu
 * @access  Private (admin, officers)
 */
exports.getAllMTU = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { district, status } = req.query;

    // Build filter
    const where = {};
    if (district) {
      where.district = district;
    }
    if (status) {
      where.status = status;
    }

    const mtuLocations = await MTULocation.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: ClientMTUAssignment,
          as: 'assignments',
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'fullName', 'phone']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      count: mtuLocations.length,
      data: mtuLocations
    });

  } catch (error) {
    console.error('❌ Error fetching MTU locations:', error);
    next(error);
  }
};

/**
 * @desc    Get MTU location by ID
 * @route   GET /api/mtu/:id
 * @access  Private
 */
exports.getMTUById = async (req, res, next) => {
  try {
    const mtu = await MTULocation.findByPk(req.params.id, {
      include: [
        {
          model: ClientMTUAssignment,
          as: 'assignments',
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'fullName', 'phone', 'hoursRequired', 'hoursCompleted']
            },
            {
              model: User,
              as: 'assigner',
              attributes: ['id', 'fullName', 'role']
            }
          ]
        }
      ]
    });

    if (!mtu) {
      return res.status(404).json({
        success: false,
        message: 'MTU location not found'
      });
    }

    res.json({
      success: true,
      data: mtu
    });

  } catch (error) {
    console.error('❌ Error fetching MTU:', error);
    next(error);
  }
};

/**
 * @desc    Update MTU location
 * @route   PUT /api/mtu/:id
 * @access  Private (superadmin only)
 */
exports.updateMTU = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only superadmin can update MTU
    if (currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update MTU locations'
      });
    }

    const mtu = await MTULocation.findByPk(req.params.id);
    if (!mtu) {
      return res.status(404).json({
        success: false,
        message: 'MTU location not found'
      });
    }

    const { name, address, status, geofence_size, geofence_center_lat, geofence_center_lon } = req.body;

    // If geofence parameters are being updated, recalculate boundaries
    if (geofence_size || geofence_center_lat || geofence_center_lon) {
      const centerLat = parseFloat(geofence_center_lat || mtu.geofenceCenterLat);
      const centerLon = parseFloat(geofence_center_lon || mtu.geofenceCenterLon);
      const size = parseInt(geofence_size || mtu.geofenceSize);

      const bounds = calculateSquareBounds(centerLat, centerLon, size);
      const validation = validateSquareBounds(bounds);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Invalid geofence boundaries: ${validation.error}`
        });
      }

      await mtu.update({
        name: name || mtu.name,
        address: address || mtu.address,
        status: status || mtu.status,
        geofenceCenterLat: centerLat,
        geofenceCenterLon: centerLon,
        geofenceSize: size,
        geofenceNorth: bounds.north,
        geofenceSouth: bounds.south,
        geofenceEast: bounds.east,
        geofenceWest: bounds.west
      });
    } else {
      // Update only basic fields
      await mtu.update({
        name: name || mtu.name,
        address: address || mtu.address,
        status: status || mtu.status
      });
    }

    res.json({
      success: true,
      message: 'MTU location updated successfully',
      data: mtu
    });

  } catch (error) {
    console.error('❌ Error updating MTU:', error);
    next(error);
  }
};

/**
 * @desc    Delete MTU location
 * @route   DELETE /api/mtu/:id
 * @access  Private (superadmin only)
 */
exports.deleteMTU = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only superadmin can delete MTU
    if (currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can delete MTU locations'
      });
    }

    const mtu = await MTULocation.findByPk(req.params.id);
    if (!mtu) {
      return res.status(404).json({
        success: false,
        message: 'MTU location not found'
      });
    }

    // Check if there are assigned clients
    const assignmentsCount = await ClientMTUAssignment.count({
      where: { mtuId: mtu.id }
    });

    if (assignmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete MTU with ${assignmentsCount} assigned clients. Please remove assignments first.`
      });
    }

    // Delete QR and PDF files
    if (mtu.qrCodeImageUrl) {
      const qrPath = path.join(__dirname, '..', mtu.qrCodeImageUrl);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }
    if (mtu.qrPdfUrl) {
      const pdfPath = path.join(__dirname, '..', mtu.qrPdfUrl);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    await mtu.destroy();

    res.json({
      success: true,
      message: 'MTU location deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting MTU:', error);
    next(error);
  }
};

/**
 * @desc    Assign client to MTU location
 * @route   POST /api/mtu/:id/assign
 * @access  Private (admin, officers)
 */
exports.assignClientToMTU = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { clientId } = req.body;
    const mtuId = req.params.id;

    // Validate inputs
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide clientId'
      });
    }

    // Check MTU exists
    const mtu = await MTULocation.findByPk(mtuId);
    if (!mtu) {
      return res.status(404).json({
        success: false,
        message: 'MTU location not found'
      });
    }

    // Check client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if already assigned
    const existingAssignment = await ClientMTUAssignment.findOne({
      where: { clientId, mtuId }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Client is already assigned to this MTU'
      });
    }

    // Create assignment
    const assignment = await ClientMTUAssignment.create({
      clientId,
      mtuId,
      assignedBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      message: 'Client assigned to MTU successfully',
      data: assignment
    });

  } catch (error) {
    console.error('❌ Error assigning client to MTU:', error);
    next(error);
  }
};

/**
 * @desc    Remove client from MTU location
 * @route   DELETE /api/mtu/:id/assign/:clientId
 * @access  Private (admin, officers)
 */
exports.removeClientFromMTU = async (req, res, next) => {
  try {
    const { id: mtuId, clientId } = req.params;

    const assignment = await ClientMTUAssignment.findOne({
      where: { mtuId, clientId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await assignment.destroy();

    res.json({
      success: true,
      message: 'Client removed from MTU successfully'
    });

  } catch (error) {
    console.error('❌ Error removing client from MTU:', error);
    next(error);
  }
};

/**
 * @desc    Verify MTU QR code (for mobile app)
 * @route   POST /api/mtu/verify-qr
 * @access  Private (clients)
 */
exports.verifyQRCode = async (req, res, next) => {
  try {
    const { qr_data, latitude, longitude } = req.body;
    const clientId = req.client?.id; // Assuming client auth middleware sets req.client

    if (!qr_data) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    // Parse QR data
    let qrObj;
    try {
      qrObj = JSON.parse(qr_data);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Verify QR code type
    if (qrObj.type !== 'mtu_checkin') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code type'
      });
    }

    // Get MTU
    const mtu = await MTULocation.findByPk(qrObj.mtu_id);
    if (!mtu) {
      return res.status(404).json({
        success: false,
        message: 'MTU location not found'
      });
    }

    // Check if MTU is active
    if (mtu.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'MTU location is not active'
      });
    }

    // Check if client is assigned to this MTU
    const assignment = await ClientMTUAssignment.findOne({
      where: { clientId, mtuId: mtu.id }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this MTU location'
      });
    }

    // Verify geofence if coordinates provided
    if (latitude && longitude) {
      const bounds = {
        north: parseFloat(mtu.geofenceNorth),
        south: parseFloat(mtu.geofenceSouth),
        east: parseFloat(mtu.geofenceEast),
        west: parseFloat(mtu.geofenceWest)
      };

      const insideGeofence = isInSquare(parseFloat(latitude), parseFloat(longitude), bounds);

      if (!insideGeofence) {
        return res.status(400).json({
          success: false,
          message: 'You are outside the MTU geofence. Please move closer to the location.',
          geofence_error: true
        });
      }
    }

    // QR code is valid
    res.json({
      success: true,
      message: 'QR code verified successfully',
      data: {
        mtu_id: mtu.id,
        mtu_code: mtu.mtuCode,
        name: mtu.name,
        district: mtu.district,
        address: mtu.address,
        geofence: {
          center: {
            lat: mtu.geofenceCenterLat,
            lon: mtu.geofenceCenterLon
          },
          bounds: {
            north: mtu.geofenceNorth,
            south: mtu.geofenceSouth,
            east: mtu.geofenceEast,
            west: mtu.geofenceWest
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verifying QR code:', error);
    next(error);
  }
};

module.exports = exports;
