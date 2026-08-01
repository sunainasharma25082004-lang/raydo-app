const mongoose = require('mongoose');
const store = require('../store/driverStore');
const Driver = require('../models/Driver');

exports.applyKyc = async (req, res) => {
  try {
    // 1. Process via legacy store (handles photo saving, base64 decoding, validation)
    const driverJson = store.applyKyc(req.body);
    
    // 2. Sync to MongoDB (don't set non-ObjectId string as _id)
    const driverData = {
      ...driverJson,
      currentLocation: { type: 'Point', coordinates: [0,0] } // Default
    };
    delete driverData.id;
    delete driverData._id;
    
    // Upsert into MongoDB
    await Driver.findOneAndUpdate(
      { phone: driverJson.phone },
      driverData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: 'KYC submitted successfully. Wait for admin approval before login.',
      driver: driverJson,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'KYC submit failed' });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const { phone, loginId, id } = req.query;
    let query = {};
    if (id && mongoose.Types.ObjectId.isValid(id)) query._id = id;
    else if (loginId) query.loginId = loginId;
    else if (phone) query.phone = phone;
    else return res.status(400).json({ message: 'Must provide id, loginId, or phone' });

    const driver = await Driver.findOne(query);
    if (!driver) return res.status(404).json({ message: 'No KYC application found' });
    
    const driverData = driver.toObject();
    delete driverData.passwordHash;
    res.json({ driver: driverData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listPending = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    let query = {};
    if (status !== 'all') {
      query.kycStatus = status;
    }
    
    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    const list = drivers.map(d => {
      const obj = d.toObject();
      delete obj.passwordHash;
      return obj;
    });
    
    res.json({ drivers: list, stats: store.getKycStats() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Full driver KYC detail for admin (documents + photo paths) */
exports.getAdminDriver = async (req, res) => {
  try {
    let driver = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      driver = await Driver.findById(req.params.id);
    }
    if (!driver) {
      driver = await Driver.findOne({ phone: req.params.id }) || await Driver.findOne({ loginId: req.params.id });
    }
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ driver: driver.toObject() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const idParam = req.params.id;
    let targetId = idParam;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      const d = await Driver.findById(idParam);
      if (d) targetId = d.phone || d._id.toString();
    } else {
      const d = await Driver.findOne({ phone: idParam }) || await Driver.findOne({ loginId: idParam });
      if (d) targetId = d.phone;
    }

    // 1. Process via legacy store (generates loginId, password hash, etc)
    const result = store.approveKyc(targetId, req.user?.username || 'admin');
    const driverJson = result.driver;
    const credentials = result.credentials;

    // 2. Sync updated driver to MongoDB
    const driverData = { ...driverJson };
    delete driverData.id;
    delete driverData._id;

    await Driver.findOneAndUpdate(
      { phone: driverJson.phone },
      driverData,
      { upsert: true, new: true }
    );

    // Send Driver ID + password to registered mobile (SMS / WhatsApp if configured)
    let credentialsNotify = null;
    try {
      const { notifyDriverCredentials } = require('../services/notify');
      credentialsNotify = await notifyDriverCredentials({
        phone: driverJson.phone,
        name: driverJson.name,
        loginId: credentials.loginId,
        password: credentials.password,
      });
    } catch (notifyErr) {
      console.warn('[KYC] credentials notify failed', notifyErr.message);
      credentialsNotify = {
        sent: false,
        channel: 'error',
        reason: notifyErr.message,
      };
    }

    const smsNote = credentialsNotify?.sent
      ? `Credentials sent to +91 ${String(driverJson.phone || '').slice(-10)} via ${credentialsNotify.channel}.`
      : `Credentials saved for admin. SMS/WhatsApp not sent (${credentialsNotify?.reason || 'no provider'}) — share manually if needed.`;

    res.json({
      message: `KYC approved. ${smsNote}`,
      ...result,
      credentialsNotify,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const idParam = req.params.id;
    let targetId = idParam;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      const d = await Driver.findById(idParam);
      if (d) targetId = d.phone || d._id.toString();
    } else {
      const d = await Driver.findOne({ phone: idParam }) || await Driver.findOne({ loginId: idParam });
      if (d) targetId = d.phone;
    }

    const reason = req.body?.reason || 'Documents incomplete or invalid';
    // 1. Reject in legacy store
    const driverJson = store.rejectKyc(targetId, reason, req.user?.username || 'admin');
    
    // 2. Sync to Mongo
    const driverData = { ...driverJson };
    delete driverData.id;
    delete driverData._id;

    await Driver.findOneAndUpdate(
      { phone: driverJson.phone },
      driverData,
      { upsert: true, new: true }
    );

    res.json({ message: 'KYC rejected', driver: driverJson });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.stats = (req, res) => {
  res.json(store.getKycStats());
};
