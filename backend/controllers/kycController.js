const store = require('../store/driverStore');

exports.applyKyc = (req, res) => {
  try {
    const driver = store.applyKyc(req.body);
    res.status(201).json({
      message: 'KYC submitted successfully. Wait for admin approval before login.',
      driver,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'KYC submit failed' });
  }
};

exports.getKycStatus = (req, res) => {
  try {
    const { phone, loginId, id } = req.query;
    let driver = null;
    if (id) driver = store.findDriverById(id);
    else if (loginId) driver = store.findDriverByLoginId(loginId);
    else if (phone) driver = store.findDriverByPhone(phone);

    if (!driver) return res.status(404).json({ message: 'No KYC application found' });
    res.json({ driver: store.publicDriver(driver) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listPending = (req, res) => {
  try {
    const status = req.query.status || 'pending';
    let list = store.listDrivers().map((d) => store.publicDriver(d, { includeSecrets: true }));
    if (status !== 'all') {
      list = list.filter((d) => d.kycStatus === status);
    }
    list.sort((a, b) => String(b.kycSubmittedAt || b.createdAt).localeCompare(String(a.kycSubmittedAt || a.createdAt)));
    res.json({ drivers: list, stats: store.getKycStats() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Full driver KYC detail for admin (documents + photo paths) */
exports.getAdminDriver = (req, res) => {
  try {
    const driver = store.findDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ driver: store.publicDriver(driver, { includeSecrets: true }) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const result = store.approveKyc(req.params.id, req.user?.username || 'admin');
    const driver = result.driver;
    const credentials = result.credentials;

    // Send Driver ID + password to registered mobile (SMS / WhatsApp if configured)
    let credentialsNotify = null;
    try {
      const { notifyDriverCredentials } = require('../services/notify');
      credentialsNotify = await notifyDriverCredentials({
        phone: driver.phone,
        name: driver.name,
        loginId: credentials.loginId,
        password: credentials.password,
      });
      // Persist last notify status on driver for admin audit
      try {
        const list = store.listDrivers();
        const raw = list.find((d) => d.id === driver.id);
        // listDrivers returns public copy without secrets — update via re-approve path
        // Write notify meta by reading/writing file through approve already saved driver
        const fs = require('fs');
        const path = require('path');
        const file = path.join(__dirname, '..', 'data', 'drivers.json');
        const all = JSON.parse(fs.readFileSync(file, 'utf8'));
        const d = all.find((x) => x.id === driver.id);
        if (d) {
          d.credentialsNotify = {
            sent: !!credentialsNotify?.sent,
            channel: credentialsNotify?.channel || 'none',
            to: credentialsNotify?.to || null,
            at: new Date().toISOString(),
            reason: credentialsNotify?.reason || null,
          };
          fs.writeFileSync(file, JSON.stringify(all, null, 2));
          if (result.driver) result.driver.credentialsNotify = d.credentialsNotify;
        }
      } catch (persistErr) {
        console.warn('[KYC] credentialsNotify persist failed', persistErr.message);
      }
    } catch (notifyErr) {
      console.warn('[KYC] credentials notify failed', notifyErr.message);
      credentialsNotify = {
        sent: false,
        channel: 'error',
        reason: notifyErr.message,
      };
    }

    const smsNote = credentialsNotify?.sent
      ? `Credentials sent to +91 ${String(driver.phone || '').slice(-10)} via ${credentialsNotify.channel}.`
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

exports.reject = (req, res) => {
  try {
    const reason = req.body?.reason || 'Documents incomplete or invalid';
    const driver = store.rejectKyc(req.params.id, reason, req.user?.username || 'admin');
    res.json({ message: 'KYC rejected', driver });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.stats = (req, res) => {
  res.json(store.getKycStats());
};
