const crypto = require('crypto');
const { signToken, JWT_EXPIRY_STUDENT_SEC } = require('./auth');

const USER_RE = /^[a-z][a-z0-9._-]{2,31}$/;
const PIN_RE = /^\d{6}$/;

function clean(value, max = 80) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function normalizeProduct(value) {
  return String(value || '').toLowerCase() === 'kamuk' ? 'kamuk' : 'infinity';
}

function productForStudentId(studentId) {
  return String(studentId || '').startsWith('KAM-') ? 'kamuk' : 'infinity';
}

function studentsTable(product) {
  return product === 'kamuk' ? 'kamuk_students' : 'infinity_students';
}

function pinDigest(pin, salt) {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

function makePinRecord(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { pinSalt: salt, pinHash: pinDigest(pin, salt) };
}

function safeEqualHex(left, right) {
  try {
    const a = Buffer.from(String(left || ''), 'hex');
    const b = Buffer.from(String(right || ''), 'hex');
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}

function verifyPin(pin, access) {
  if (!PIN_RE.test(pin) || !access?.pinSalt || !access?.pinHash) return false;
  return safeEqualHex(pinDigest(pin, access.pinSalt), access.pinHash);
}

function publicAccess(student) {
  const access = student?.simulationAccess || {};
  return {
    username: clean(access.username, 32),
    configured: Boolean(access.pinHash && access.pinSalt),
    resetRequired: Boolean(access.resetRequired),
    updatedAt: access.updatedAt || null
  };
}

function registerSimulationAccess(app, deps) {
  const {
    requireProductAuth,
    requireTeacherAccess,
    sbGetStudentRow,
    sbSetStudent,
    sbGet
  } = deps;

  app.get('/simulation/access', requireProductAuth, async (req, res) => {
    try {
      const studentId = clean(req.auth?.studentId || req.auth?.sub, 40);
      if (req.auth?.role !== 'student' || !studentId) {
        return res.status(403).json({ error: 'Student access required', code: 'STUDENT_REQUIRED' });
      }
      const row = await sbGetStudentRow(studentId);
      if (!row?.data) return res.status(404).json({ error: 'Student not found' });
      return res.json({
        ok: true,
        product: productForStudentId(studentId),
        studentId,
        access: publicAccess(row.data),
        suggestedUsername: clean(row.data.portalUser, 32)
      });
    } catch (error) {
      console.error('Simulation access read:', error.message);
      return res.status(500).json({ error: 'Simulation access unavailable' });
    }
  });

  app.post('/simulation/access/setup', requireProductAuth, async (req, res) => {
    try {
      const studentId = clean(req.auth?.studentId || req.auth?.sub, 40);
      if (req.auth?.role !== 'student' || !studentId) {
        return res.status(403).json({ error: 'Student access required', code: 'STUDENT_REQUIRED' });
      }
      const username = clean(req.body?.username, 32).toLowerCase();
      const pin = clean(req.body?.pin, 6);
      if (!USER_RE.test(username)) {
        return res.status(400).json({ error: 'Use 3–32 lowercase letters, numbers, dots, dashes or underscores.' });
      }
      if (!PIN_RE.test(pin)) {
        return res.status(400).json({ error: 'The simulation password must contain exactly 6 digits.' });
      }
      const product = productForStudentId(studentId);
      const row = await sbGetStudentRow(studentId);
      if (!row?.data) return res.status(404).json({ error: 'Student not found' });
      const current = row.data.simulationAccess || {};
      if (current.pinHash && !current.resetRequired) {
        return res.status(409).json({ error: 'Simulation access is already configured. Ask your trainer for a reset.' });
      }
      const rows = await sbGet(studentsTable(product));
      const duplicate = rows.find(item =>
        item.id !== studentId &&
        clean(item.data?.simulationAccess?.username, 32).toLowerCase() === username
      );
      if (duplicate) return res.status(409).json({ error: 'That simulation username is already in use.' });

      const record = {
        username,
        ...makePinRecord(pin),
        version: crypto.randomBytes(12).toString('hex'),
        resetRequired: false,
        updatedAt: new Date().toISOString()
      };
      const student = { ...row.data, simulationAccess: record };
      await sbSetStudent(studentId, student);
      return res.json({ ok: true, product, studentId, access: publicAccess(student) });
    } catch (error) {
      console.error('Simulation access setup:', error.message);
      return res.status(500).json({ error: 'Simulation access could not be configured' });
    }
  });

  app.post('/simulation/access/login', async (req, res) => {
    try {
      const username = clean(req.body?.username, 32).toLowerCase();
      const pin = clean(req.body?.pin, 6);
      const product = normalizeProduct(req.body?.product);
      if (!USER_RE.test(username) || !PIN_RE.test(pin)) {
        return res.status(401).json({ error: 'Invalid simulation credentials' });
      }
      const rows = await sbGet(studentsTable(product));
      const match = rows.find(item =>
        clean(item.data?.simulationAccess?.username, 32).toLowerCase() === username
      );
      const access = match?.data?.simulationAccess;
      if (!match || match.data?.status === 'suspended' || access?.resetRequired || !verifyPin(pin, access)) {
        return res.status(401).json({ error: 'Invalid simulation credentials' });
      }
      const name = clean(match.data?.info?.name || match.data?.name || username, 100);
      const token = signToken({
        sub: match.id,
        role: 'student',
        studentId: match.id,
        name,
        product,
        scope: 'simulation',
        simulationVersion: access.version || access.updatedAt || null
      }, JWT_EXPIRY_STUDENT_SEC);
      return res.json({
        ok: true,
        token,
        expiresIn: JWT_EXPIRY_STUDENT_SEC,
        role: 'student',
        studentId: match.id,
        name,
        product
      });
    } catch (error) {
      console.error('Simulation access login:', error.message);
      return res.status(500).json({ error: 'Simulation login unavailable' });
    }
  });

  app.post('/simulation/access/reset', requireTeacherAccess, async (req, res) => {
    try {
      const studentId = clean(req.body?.studentId, 40);
      const requestedProduct = normalizeProduct(req.body?.product);
      if (!studentId || productForStudentId(studentId) !== requestedProduct) {
        return res.status(400).json({ error: 'Student and product do not match' });
      }
      const row = await sbGetStudentRow(studentId);
      if (!row?.data) return res.status(404).json({ error: 'Student not found' });
      const temporaryPin = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const username = clean(
        row.data?.simulationAccess?.username || row.data?.portalUser,
        32
      ).toLowerCase();
      if (!USER_RE.test(username)) {
        return res.status(409).json({ error: 'Student needs a valid simulation username first' });
      }
      const record = {
        username,
        ...makePinRecord(temporaryPin),
        version: crypto.randomBytes(12).toString('hex'),
        resetRequired: false,
        resetBy: clean(req.auth?.email || req.auth?.sub, 100),
        updatedAt: new Date().toISOString()
      };
      const student = { ...row.data, simulationAccess: record };
      await sbSetStudent(studentId, student);
      return res.json({
        ok: true,
        studentId,
        product: requestedProduct,
        username,
        temporaryPin
      });
    } catch (error) {
      console.error('Simulation access reset:', error.message);
      return res.status(500).json({ error: 'Simulation password could not be reset' });
    }
  });
}

module.exports = {
  registerSimulationAccess,
  makePinRecord,
  verifyPin,
  publicAccess,
  productForStudentId
};
