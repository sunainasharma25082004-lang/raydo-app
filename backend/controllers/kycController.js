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

exports.approve = (req, res) => {
  try {
    const result = store.approveKyc(req.params.id, req.user?.username || 'admin');
    res.json({
      message: 'KYC approved. Share Driver ID & password with the partner.',
      ...result,
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
