import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { initDatabase, runQuery, getQuery, allQuery } from './db.js';
import { requestOTP, verifyOTP } from './otp.js';
import { generateToken, authenticate, authorizeRoles, enforceBranchAccess, logAudit } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend assets in production
const clientDistDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file size
});

// ==========================================
// 1. AUTHENTICATION & OTP APIS
// ==========================================

// Super Admin Request OTP
app.post('/api/auth/login-otp/request', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required.' });

    const result = await requestOTP(mobile);
    await logAudit(null, 'Super Admin Guest', 'GUEST', 'REQUEST_OTP', 'AUTH', null, { mobile });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin Verify OTP
app.post('/api/auth/login-otp/verify', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP are required.' });

    const user = await verifyOTP(mobile, otp);
    const token = generateToken(user);

    await logAudit(user.id, user.name, user.role, 'OTP_LOGIN_SUCCESS', 'AUTH', user.id, { mobile });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        state_id: user.state_id,
        district_id: user.district_id,
        branch_id: user.branch_id
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Password Login for MD, GM, Executive, Supervisor
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // mobile or email
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Mobile and Password are required.' });
    }

    const cleanInput = identifier.trim();
    const user = await getQuery(
      `SELECT u.*, b.name as branch_name 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE (u.email = ? OR u.mobile = ?) AND u.is_active = 1`,
      [cleanInput, cleanInput]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or user account deactivated.' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Super Admin must login using OTP verification.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const token = generateToken(user);
    await logAudit(user.id, user.name, user.role, 'PASSWORD_LOGIN_SUCCESS', 'AUTH', user.id, { identifier: cleanInput });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        state_id: user.state_id,
        district_id: user.district_id,
        branch_id: user.branch_id,
        branch_name: user.branch_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await getQuery(
      `SELECT u.id, u.name, u.mobile, u.email, u.role, u.state_id, u.district_id, u.branch_id,
              b.name as branch_name, d.name as district_name, s.name as state_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       LEFT JOIN districts d ON u.district_id = d.id
       LEFT JOIN states s ON u.state_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. FILE UPLOAD API
// ==========================================
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ORGANIZATION HIERARCHY APIS
// ==========================================

// Get Complete Hierarchy Tree
app.get('/api/hierarchy', authenticate, async (req, res) => {
  try {
    const states = await allQuery(`SELECT * FROM states ORDER BY name ASC`);
    const districts = await allQuery(`SELECT * FROM districts ORDER BY name ASC`);
    const branches = await allQuery(`SELECT * FROM branches ORDER BY name ASC`);

    const tree = states.map(s => {
      const stateDistricts = districts.filter(d => d.state_id === s.id).map(d => {
        const districtBranches = branches.filter(b => b.district_id === d.id);
        return { ...d, branches: districtBranches };
      });
      return { ...s, districts: stateDistricts };
    });

    res.json({ states, districts, branches, tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// States CRUD (Super Admin)
app.post('/api/states', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, code } = req.body;
    const result = await runQuery(`INSERT INTO states (name, code) VALUES (?, ?)`, [name, code]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_STATE', 'STATE', result.lastID, { name, code });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Districts CRUD (Super Admin)
app.post('/api/districts', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { state_id, name } = req.body;
    const result = await runQuery(`INSERT INTO districts (state_id, name) VALUES (?, ?)`, [state_id, name]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_DISTRICT', 'DISTRICT', result.lastID, { state_id, name });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Branches / Camps CRUD (Super Admin)
app.post('/api/branches', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { district_id, name, type, code, address } = req.body;
    const result = await runQuery(
      `INSERT INTO branches (district_id, name, type, code, address) VALUES (?, ?, ?, ?, ?)`,
      [district_id, name, type || 'BRANCH', code, address]
    );
    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_BRANCH', 'BRANCH', result.lastID, { name, code, type });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. USER MANAGEMENT APIS (Super Admin)
// ==========================================

app.get('/api/users', authenticate, authorizeRoles('SUPER_ADMIN', 'MD', 'GM', 'EXECUTIVE'), async (req, res) => {
  try {
    const users = await allQuery(`
      SELECT u.id, u.name, u.mobile, u.email, u.role, u.state_id, u.district_id, u.branch_id, u.is_active, u.created_at,
             b.name as branch_name, d.name as district_name, s.name as state_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN districts d ON u.district_id = d.id
      LEFT JOIN states s ON u.state_id = s.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, mobile, email, password, role, state_id, district_id, branch_id } = req.body;

    if (!name || !role) return res.status(400).json({ error: 'Name and Role are required.' });

    let passwordHash = null;
    if (role !== 'SUPER_ADMIN') {
      if (!password) return res.status(400).json({ error: 'Password is required for non-Super Admin users.' });
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await runQuery(
      `INSERT INTO users (name, mobile, email, password_hash, role, state_id, district_id, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile || null, email || null, passwordHash, role, state_id || null, district_id || null, branch_id || null]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_USER', 'USER', result.lastID, { name, role, email, branch_id });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id/status', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { is_active } = req.body;
    await runQuery(`UPDATE users SET is_active = ? WHERE id = ?`, [is_active ? 1 : 0, req.params.id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'TOGGLE_USER_STATUS', 'USER', req.params.id, { is_active });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. WORKER MANAGEMENT APIS
// ==========================================

app.get('/api/workers', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    let sql = `
      SELECT w.*, b.name as branch_name, dep.name as department_name, des.name as designation_name
      FROM workers w
      JOIN branches b ON w.branch_id = b.id
      LEFT JOIN departments dep ON w.department_id = dep.id
      LEFT JOIN designations des ON w.designation_id = des.id
    `;
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      sql += ` WHERE w.branch_id = ?`;
      params.push(req.user.branch_id);
    } else if (req.query.branch_id) {
      sql += ` WHERE w.branch_id = ?`;
      params.push(req.query.branch_id);
    }

    sql += ` ORDER BY w.name ASC`;
    const workers = await allQuery(sql, params);
    res.json({ workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workers', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR', 'GM', 'EXECUTIVE'), async (req, res) => {
  try {
    const { name, employee_code, designation_id, department_id, branch_id } = req.body;
    const targetBranch = req.user.role === 'SUPERVISOR' ? req.user.branch_id : branch_id;

    if (!name || !employee_code || !targetBranch) {
      return res.status(400).json({ error: 'Name, Employee Code, and Branch are required.' });
    }

    const result = await runQuery(
      `INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [targetBranch, name, employee_code, designation_id || null, department_id || null]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_WORKER', 'WORKER', result.lastID, { name, employee_code, branch_id: targetBranch });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/workers/:id/status', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { status } = req.body;
    await runQuery(`UPDATE workers SET status = ? WHERE id = ?`, [status, req.params.id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'UPDATE_WORKER_STATUS', 'WORKER', req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. WORKER ATTENDANCE APIS
// ==========================================

app.get('/api/attendance', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { date, branch_id } = req.query;
    let sql = `
      SELECT a.*, w.name as worker_name, w.employee_code, b.name as branch_name, u.name as recorder_name
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN branches b ON a.branch_id = b.id
      LEFT JOIN users u ON a.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      sql += ` AND a.branch_id = ?`;
      params.push(req.user.branch_id);
    } else if (branch_id) {
      sql += ` AND a.branch_id = ?`;
      params.push(branch_id);
    }

    if (date) {
      sql += ` AND a.date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY a.date DESC, w.name ASC`;
    const attendance = await allQuery(sql, params);
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/bulk', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { date, shift, records, photo_url } = req.body;
    const branch_id = req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.body.branch_id;

    if (!date || !records || !Array.isArray(records) || !branch_id) {
      return res.status(400).json({ error: 'Date, Branch, and Attendance records are required.' });
    }

    for (const item of records) {
      const existing = await getQuery(
        `SELECT id FROM attendance WHERE date = ? AND worker_id = ? AND shift = ?`,
        [date, item.worker_id, shift || 'MORNING']
      );

      if (existing) {
        await runQuery(
          `UPDATE attendance SET status = ?, check_in = ?, check_out = ?, remarks = ?, photo_url = COALESCE(?, photo_url), updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.status, item.check_in || '06:30 AM', item.check_out || '02:30 PM', item.remarks || '', photo_url || null, existing.id]
        );
      } else {
        await runQuery(
          `INSERT INTO attendance (date, worker_id, branch_id, shift, check_in, check_out, status, photo_url, remarks, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [date, item.worker_id, branch_id, shift || 'MORNING', item.check_in || '06:30 AM', item.check_out || '02:30 PM', item.status, photo_url || null, item.remarks || '', req.user.id]
        );
      }
    }

    await logAudit(req.user.id, req.user.name, req.user.role, 'RECORD_BULK_ATTENDANCE', 'ATTENDANCE', null, { date, branch_id, totalCount: records.length });

    res.json({ success: true, message: `Recorded attendance for ${records.length} workers successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. DAILY WORK LOG APIS
// ==========================================

app.get('/api/work-logs', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { date, branch_id, category_id } = req.query;
    let sql = `
      SELECT wl.*, b.name as branch_name, wc.name as category_name, u.name as recorder_name
      FROM work_logs wl
      JOIN branches b ON wl.branch_id = b.id
      JOIN work_categories wc ON wl.category_id = wc.id
      LEFT JOIN users u ON wl.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      sql += ` AND wl.branch_id = ?`;
      params.push(req.user.branch_id);
    } else if (branch_id) {
      sql += ` AND wl.branch_id = ?`;
      params.push(branch_id);
    }

    if (date) {
      sql += ` AND wl.date = ?`;
      params.push(date);
    }

    if (category_id) {
      sql += ` AND wl.category_id = ?`;
      params.push(category_id);
    }

    sql += ` ORDER BY wl.date DESC, wl.created_at DESC`;
    const logs = await allQuery(sql, params);
    res.json({ workLogs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/work-logs', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { date, category_id, area, description, start_time, completion_time, status, photos, worker_ids, remarks } = req.body;
    const branch_id = req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.body.branch_id;

    if (!date || !category_id || !area || !branch_id) {
      return res.status(400).json({ error: 'Date, Category, Area, and Branch are required.' });
    }

    const result = await runQuery(
      `INSERT INTO work_logs (date, branch_id, worker_ids, category_id, area, description, start_time, completion_time, status, photos, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        branch_id,
        JSON.stringify(worker_ids || []),
        category_id,
        area,
        description || '',
        start_time || '07:00 AM',
        completion_time || '09:00 AM',
        status || 'COMPLETED',
        JSON.stringify(photos || []),
        remarks || '',
        req.user.id
      ]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_WORK_LOG', 'WORK_LOG', result.lastID, { date, category_id, area, branch_id });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. ISSUES / COMPLAINTS APIS
// ==========================================

app.get('/api/issues', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { branch_id, priority, status } = req.query;
    let sql = `
      SELECT i.*, b.name as branch_name, ic.name as category_name, ic.icon as category_icon, u.name as reporter_name
      FROM issues i
      JOIN branches b ON i.branch_id = b.id
      JOIN issue_categories ic ON i.category_id = ic.id
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      sql += ` AND i.branch_id = ?`;
      params.push(req.user.branch_id);
    } else if (branch_id) {
      sql += ` AND i.branch_id = ?`;
      params.push(branch_id);
    }

    if (priority) {
      sql += ` AND i.priority = ?`;
      params.push(priority);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.created_at DESC`;
    const issues = await allQuery(sql, params);
    res.json({ issues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/issues', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR', 'GM', 'EXECUTIVE'), async (req, res) => {
  try {
    const { category_id, priority, description, photo_url } = req.body;
    const branch_id = req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.body.branch_id;

    if (!category_id || !description || !branch_id) {
      return res.status(400).json({ error: 'Category, Description, and Branch are required.' });
    }

    const ticketNo = 'TKT-' + Date.now().toString().slice(-6);

    const result = await runQuery(
      `INSERT INTO issues (ticket_no, branch_id, category_id, priority, description, status, photo_url, reported_by)
       VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
      [ticketNo, branch_id, category_id, priority || 'MEDIUM', description, photo_url || null, req.user.id]
    );

    // Create notification for higher management
    await runQuery(
      `INSERT INTO notifications (role_target, title, message, link)
       VALUES ('GM', 'New Issue Ticket Reported', ?, ?)`,
      [`Ticket ${ticketNo}: ${description.substring(0, 60)}...`, `/issues`]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'REPORT_ISSUE', 'ISSUE', result.lastID, { ticketNo, priority, branch_id });
    res.json({ success: true, id: result.lastID, ticket_no: ticketNo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/issues/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    await runQuery(`UPDATE issues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'UPDATE_ISSUE_STATUS', 'ISSUE', req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 9. DAILY REPORTS APIS
// ==========================================

app.get('/api/daily-reports', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { date, branch_id } = req.query;
    let sql = `
      SELECT dr.*, b.name as branch_name, u.name as supervisor_name
      FROM daily_reports dr
      JOIN branches b ON dr.branch_id = b.id
      JOIN users u ON dr.supervisor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      sql += ` AND dr.branch_id = ?`;
      params.push(req.user.branch_id);
    } else if (branch_id) {
      sql += ` AND dr.branch_id = ?`;
      params.push(branch_id);
    }

    if (date) {
      sql += ` AND dr.date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY dr.date DESC, dr.created_at DESC`;
    const reports = await allQuery(sql, params);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/daily-reports', authenticate, authorizeRoles('SUPER_ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { date, attendance_summary, work_summary, pending_tasks, issues_summary, remarks, photos } = req.body;
    const branch_id = req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.body.branch_id;

    if (!date || !branch_id) {
      return res.status(400).json({ error: 'Date and Branch are required.' });
    }

    const result = await runQuery(
      `INSERT INTO daily_reports (date, branch_id, supervisor_id, attendance_summary, work_summary, pending_tasks, issues_summary, remarks, photos, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [
        date,
        branch_id,
        req.user.id,
        JSON.stringify(attendance_summary || {}),
        JSON.stringify(work_summary || []),
        pending_tasks || '',
        issues_summary || '',
        remarks || '',
        JSON.stringify(photos || [])
      ]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', result.lastID, { date, branch_id });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 10. QUESTIONS & COMMUNICATION APIS
// ==========================================

app.get('/api/questions', authenticate, async (req, res) => {
  try {
    const { record_type, record_id } = req.query;
    if (!record_type || !record_id) {
      return res.status(400).json({ error: 'record_type and record_id are required.' });
    }

    const questions = await allQuery(
      `SELECT * FROM questions WHERE record_type = ? AND record_id = ? ORDER BY asked_at ASC`,
      [record_type, record_id]
    );
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions', authenticate, async (req, res) => {
  try {
    const { record_type, record_id, question_text } = req.body;
    if (!record_type || !record_id || !question_text) {
      return res.status(400).json({ error: 'record_type, record_id, and question_text are required.' });
    }

    const result = await runQuery(
      `INSERT INTO questions (record_type, record_id, asked_by, asked_by_name, asked_by_role, question_text, status)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
      [record_type, record_id, req.user.id, req.user.name, req.user.role, question_text]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'ASK_QUESTION', record_type, record_id, { question_text });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/questions/:id/reply', authenticate, async (req, res) => {
  try {
    const { reply_text } = req.body;
    if (!reply_text) return res.status(400).json({ error: 'reply_text is required.' });

    await runQuery(
      `UPDATE questions 
       SET reply_text = ?, replied_by = ?, replied_by_name = ?, status = 'ANSWERED', replied_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reply_text, req.user.id, req.user.name, req.params.id]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'REPLY_QUESTION', 'QUESTION', req.params.id, { reply_text });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 11. BILLS & INVOICES APIS
// ==========================================
// Mandatory requirement: Supervisor CANNOT upload, edit, or delete bills.
// Supervisor can ONLY search/view/download bills for their assigned branch!
// Non-supervisor higher authorized roles can view, search, upload across states/districts/branches.

app.get('/api/bills', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { state_id, district_id, branch_id, bill_no, vendor_name } = req.query;
    let sql = `
      SELECT b.*, s.name as state_name, d.name as district_name, br.name as branch_name, u.name as uploader_name
      FROM bills b
      JOIN states s ON b.state_id = s.id
      JOIN districts d ON b.district_id = d.id
      JOIN branches br ON b.branch_id = br.id
      LEFT JOIN users u ON b.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // ENFORCE SUPERVISOR ISOLATION
    if (req.user.role === 'SUPERVISOR') {
      sql += ` AND b.branch_id = ?`;
      params.push(req.user.branch_id);
    } else {
      if (branch_id) { sql += ` AND b.branch_id = ?`; params.push(branch_id); }
      if (district_id) { sql += ` AND b.district_id = ?`; params.push(district_id); }
      if (state_id) { sql += ` AND b.state_id = ?`; params.push(state_id); }
    }

    if (bill_no) { sql += ` AND (b.bill_no LIKE ? OR b.invoice_no LIKE ?)`; params.push(`%${bill_no}%`, `%${bill_no}%`); }
    if (vendor_name) { sql += ` AND b.vendor_name LIKE ?`; params.push(`%${vendor_name}%`); }

    sql += ` ORDER BY b.date DESC, b.created_at DESC`;
    const bills = await allQuery(sql, params);
    res.json({ bills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', authenticate, authorizeRoles('SUPER_ADMIN', 'MD', 'GM', 'EXECUTIVE'), async (req, res) => {
  try {
    const { bill_no, invoice_no, date, state_id, district_id, branch_id, bill_type, vendor_name, amount, description, remarks, file_url } = req.body;

    if (!bill_no || !invoice_no || !date || !branch_id || !amount || !file_url) {
      return res.status(400).json({ error: 'Bill No, Invoice No, Date, Branch, Amount, and File are required.' });
    }

    const branch = await getQuery(`SELECT district_id FROM branches WHERE id = ?`, [branch_id]);
    if (!branch) return res.status(400).json({ error: 'Invalid branch ID.' });
    const district = await getQuery(`SELECT state_id FROM districts WHERE id = ?`, [branch.district_id]);

    const result = await runQuery(
      `INSERT INTO bills (bill_no, invoice_no, date, state_id, district_id, branch_id, bill_type, vendor_name, amount, description, remarks, file_url, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bill_no,
        invoice_no,
        date,
        district ? district.state_id : (state_id || 1),
        branch.district_id,
        branch_id,
        bill_type || 'Sanitation Supplies',
        vendor_name || 'Vendor',
        parseFloat(amount),
        description || '',
        remarks || '',
        file_url,
        req.user.id
      ]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'UPLOAD_BILL', 'BILL', result.lastID, { bill_no, amount, branch_id });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', authenticate, authorizeRoles('SUPER_ADMIN', 'EXECUTIVE'), async (req, res) => {
  try {
    await runQuery(`DELETE FROM bills WHERE id = ?`, [req.params.id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'DELETE_BILL', 'BILL', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 12. AUDIT LOGS APIS
// ==========================================

app.get('/api/audit-logs', authenticate, authorizeRoles('SUPER_ADMIN', 'MD', 'GM'), async (req, res) => {
  try {
    const logs = await allQuery(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`);
    res.json({ auditLogs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. MASTER CONFIGURATION APIS
// ==========================================

app.get('/api/master-config', authenticate, async (req, res) => {
  try {
    const workCategories = await allQuery(`SELECT * FROM work_categories ORDER BY name ASC`);
    const issueCategories = await allQuery(`SELECT * FROM issue_categories ORDER BY name ASC`);
    const departments = await allQuery(`SELECT * FROM departments ORDER BY name ASC`);
    const designations = await allQuery(`SELECT * FROM designations ORDER BY name ASC`);
    res.json({ workCategories, issueCategories, departments, designations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/master-config/:type', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { type } = req.params;
    const { name, description, icon } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required.' });

    let result;
    if (type === 'work-categories') {
      result = await runQuery(`INSERT INTO work_categories (name, description) VALUES (?, ?)`, [name, description || '']);
    } else if (type === 'issue-categories') {
      result = await runQuery(`INSERT INTO issue_categories (name, icon) VALUES (?, ?)`, [name, icon || 'AlertTriangle']);
    } else if (type === 'departments') {
      result = await runQuery(`INSERT INTO departments (name) VALUES (?)`, [name]);
    } else if (type === 'designations') {
      result = await runQuery(`INSERT INTO designations (name) VALUES (?)`, [name]);
    } else {
      return res.status(400).json({ error: 'Invalid config type.' });
    }

    await logAudit(req.user.id, req.user.name, req.user.role, `ADD_MASTER_${type.toUpperCase()}`, 'CONFIG', result.lastID, { name });
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 14. DASHBOARD AGGREGATE STATS API
// ==========================================

app.get('/api/dashboard/stats', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let branchFilter = '';
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      branchFilter = ' WHERE branch_id = ?';
      params.push(req.user.branch_id);
    } else if (req.query.branch_id) {
      branchFilter = ' WHERE branch_id = ?';
      params.push(req.query.branch_id);
    }

    const totalBranches = await getQuery(`SELECT COUNT(*) as count FROM branches`);
    const totalWorkers = await getQuery(`SELECT COUNT(*) as count FROM workers ${branchFilter}`, params);
    
    // Today's Attendance stats
    let attSql = `SELECT status, COUNT(*) as count FROM attendance WHERE date = ?`;
    const attParams = [today];
    if (req.user.role === 'SUPERVISOR' || req.query.branch_id) {
      attSql += ` AND branch_id = ?`;
      attParams.push(req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.query.branch_id);
    }
    attSql += ` GROUP BY status`;
    const attendanceStats = await allQuery(attSql, attParams);

    // Issues count by status
    let issueSql = `SELECT status, COUNT(*) as count FROM issues`;
    const issueParams = [];
    if (req.user.role === 'SUPERVISOR' || req.query.branch_id) {
      issueSql += ` WHERE branch_id = ?`;
      issueParams.push(req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.query.branch_id);
    }
    issueSql += ` GROUP BY status`;
    const issueStats = await allQuery(issueSql, issueParams);

    // Today's Work logs
    let workSql = `SELECT COUNT(*) as count FROM work_logs WHERE date = ?`;
    const workParams = [today];
    if (req.user.role === 'SUPERVISOR' || req.query.branch_id) {
      workSql += ` AND branch_id = ?`;
      workParams.push(req.user.role === 'SUPERVISOR' ? req.user.branch_id : req.query.branch_id);
    }
    const todayWorkCount = await getQuery(workSql, workParams);

    // Recent Audit Logs
    const recentAudit = await allQuery(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6`);

    res.json({
      totalBranches: totalBranches ? totalBranches.count : 0,
      totalWorkers: totalWorkers ? totalWorkers.count : 0,
      todayWorkCount: todayWorkCount ? todayWorkCount.count : 0,
      attendanceStats,
      issueStats,
      recentAudit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback route for React SPA routing
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(clientDistDir, 'index.html'))) {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  } else {
    res.send('API Server is running. Frontend build index.html will be served when built.');
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  REBUILD HYGIENE SYSTEMS - PRODUCTION BACKEND SERVER`);
    console.log(`  Sri Chaitanya Educational Institutions`);
    console.log(`  Listening on HTTP Port: ${PORT}`);
    console.log(`  Super Admin Registered OTP Mobile: ${process.env.SUPER_ADMIN_MOBILE || '6304261686'}`);
    console.log(`======================================================\n`);
  });
}).catch(err => {
  console.error('Failed to initialize server database:', err);
});
