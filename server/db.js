import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../hygiene_systems.db');
const db = new sqlite3.Database(dbPath);

// Helper for promise-based queries
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export async function initDatabase() {
  console.log('Initializing SQLite database at:', dbPath);

  // Enable foreign keys
  await runQuery('PRAGMA foreign_keys = ON;');

  // Tables schema
  await runQuery(`
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(state_id) REFERENCES states(id) ON DELETE CASCADE
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('SCHOOL', 'COLLEGE', 'HOSTEL', 'CAMP', 'BRANCH')) DEFAULT 'BRANCH',
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(district_id) REFERENCES districts(id) ON DELETE CASCADE
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT CHECK(role IN ('SUPER_ADMIN', 'MD', 'GM', 'EXECUTIVE', 'SUPERVISOR')) NOT NULL,
      state_id INTEGER,
      district_id INTEGER,
      branch_id INTEGER,
      camp_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS otp_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS designations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      employee_code TEXT NOT NULL UNIQUE,
      designation_id INTEGER,
      department_id INTEGER,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY(designation_id) REFERENCES designations(id) ON DELETE SET NULL,
      FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS work_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS issue_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'AlertTriangle'
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      worker_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      shift TEXT CHECK(shift IN ('MORNING', 'EVENING', 'NIGHT')) DEFAULT 'MORNING',
      check_in TEXT,
      check_out TEXT,
      status TEXT CHECK(status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')) DEFAULT 'PRESENT',
      photo_url TEXT,
      remarks TEXT,
      recorded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY(recorded_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS work_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      worker_ids TEXT NOT NULL, -- JSON array of worker IDs
      category_id INTEGER NOT NULL,
      area TEXT NOT NULL,
      description TEXT,
      start_time TEXT,
      completion_time TEXT,
      status TEXT CHECK(status IN ('COMPLETED', 'IN_PROGRESS', 'PENDING')) DEFAULT 'COMPLETED',
      photos TEXT, -- JSON array of image URLs
      remarks TEXT,
      recorded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES work_categories(id),
      FOREIGN KEY(recorded_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no TEXT NOT NULL UNIQUE,
      branch_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')) DEFAULT 'OPEN',
      photo_url TEXT,
      reported_by INTEGER NOT NULL,
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES issue_categories(id),
      FOREIGN KEY(reported_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      supervisor_id INTEGER NOT NULL,
      attendance_summary TEXT, -- JSON
      work_summary TEXT, -- JSON
      pending_tasks TEXT,
      issues_summary TEXT,
      remarks TEXT,
      photos TEXT, -- JSON array
      status TEXT CHECK(status IN ('SUBMITTED', 'REVIEWED')) DEFAULT 'SUBMITTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY(supervisor_id) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT CHECK(record_type IN ('REPORT', 'ISSUE', 'ATTENDANCE', 'WORK_LOG', 'BILL')) NOT NULL,
      record_id INTEGER NOT NULL,
      asked_by INTEGER NOT NULL,
      asked_by_name TEXT NOT NULL,
      asked_by_role TEXT NOT NULL,
      question_text TEXT NOT NULL,
      reply_text TEXT,
      replied_by INTEGER,
      replied_by_name TEXT,
      status TEXT CHECK(status IN ('OPEN', 'ANSWERED')) DEFAULT 'OPEN',
      asked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replied_at DATETIME,
      FOREIGN KEY(asked_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_no TEXT NOT NULL,
      invoice_no TEXT NOT NULL,
      date TEXT NOT NULL,
      state_id INTEGER NOT NULL,
      district_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      bill_type TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      remarks TEXT,
      file_url TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(state_id) REFERENCES states(id),
      FOREIGN KEY(district_id) REFERENCES districts(id),
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS branch_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      category TEXT DEFAULT 'GENERAL',
      file_url TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role_target TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      role TEXT,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  await seedInitialData();
}

async function seedInitialData() {
  const stateCount = await getQuery('SELECT COUNT(*) as count FROM states');
  if (stateCount.count === 0) {
    console.log('Seeding initial organizational hierarchy & master data...');

    // States
    const ap = await runQuery('INSERT INTO states (name, code) VALUES (?, ?)', ['Andhra Pradesh', 'AP']);
    const ts = await runQuery('INSERT INTO states (name, code) VALUES (?, ?)', ['Telangana', 'TS']);
    const ka = await runQuery('INSERT INTO states (name, code) VALUES (?, ?)', ['Karnataka', 'KA']);

    // Districts
    const vizag = await runQuery('INSERT INTO districts (state_id, name) VALUES (?, ?)', [ap.lastID, 'Visakhapatnam']);
    const vjw = await runQuery('INSERT INTO districts (state_id, name) VALUES (?, ?)', [ap.lastID, 'Vijayawada']);
    const hyd = await runQuery('INSERT INTO districts (state_id, name) VALUES (?, ?)', [ts.lastID, 'Hyderabad']);
    const blr = await runQuery('INSERT INTO districts (state_id, name) VALUES (?, ?)', [ka.lastID, 'Bengaluru Urban']);

    // Branches / Camps
    const b1 = await runQuery('INSERT INTO branches (district_id, name, type, code, address) VALUES (?, ?, ?, ?, ?)', [
      vizag.lastID, 'Sri Chaitanya Techno Campus - Gajuwaka', 'CAMP', 'SC-VZG-001', 'Gajuwaka Main Road, Visakhapatnam'
    ]);
    const b2 = await runQuery('INSERT INTO branches (district_id, name, type, code, address) VALUES (?, ?, ?, ?, ?)', [
      vjw.lastID, 'Sri Chaitanya Junior College - Benz Circle', 'COLLEGE', 'SC-VJW-002', 'Benz Circle, Vijayawada'
    ]);
    const b3 = await runQuery('INSERT INTO branches (district_id, name, type, code, address) VALUES (?, ?, ?, ?, ?)', [
      hyd.lastID, 'Sri Chaitanya Olympiad School - Madhapur', 'SCHOOL', 'SC-HYD-003', 'HITEC City Road, Madhapur, Hyderabad'
    ]);
    const b4 = await runQuery('INSERT INTO branches (district_id, name, type, code, address) VALUES (?, ?, ?, ?, ?)', [
      hyd.lastID, 'Sri Chaitanya Central Hostel - Kukatpally', 'HOSTEL', 'SC-HYD-004', 'KPHB Colony, Kukatpally, Hyderabad'
    ]);

    // Departments
    await runQuery('INSERT INTO departments (name) VALUES (?)', ['Housekeeping']);
    await runQuery('INSERT INTO departments (name) VALUES (?)', ['Sanitation']);
    await runQuery('INSERT INTO departments (name) VALUES (?)', ['Waste Management']);
    await runQuery('INSERT INTO departments (name) VALUES (?)', ['Facility Maintenance']);

    // Designations
    await runQuery('INSERT INTO designations (name) VALUES (?)', ['Housekeeping Supervisor']);
    await runQuery('INSERT INTO designations (name) VALUES (?)', ['Senior Sanitation Lead']);
    await runQuery('INSERT INTO designations (name) VALUES (?)', ['Cleaner / Attendant']);
    await runQuery('INSERT INTO designations (name) VALUES (?)', ['Waste Handler']);

    // Work Categories
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Classroom Cleaning', 'Sweeping, mopping, board cleaning, desk wiping']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Hostel Room Cleaning', 'Bed area sanitization, floor wash, dustbin emptying']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Bathroom & Restroom Sanitation', 'Toilet scrubbing, sink sanitization, disinfectant spray']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Campus & Courtyard Sweeping', 'Outdoor ground sweeping, leaf collection']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Waste Collection & Disposal', 'Emptying bins, segregate dry & wet waste']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Deep Cleaning & Disinfection', 'Chemical wash, high-reach dusting, window cleaning']);
    await runQuery('INSERT INTO work_categories (name, description) VALUES (?, ?)', ['Water Tank & Area Washing', 'Overhead tank sanitation & water dispenser cleaning']);

    // Issue Categories
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['Water Leakage / Plumbing', 'Droplet']);
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['Bathroom Hygiene Failure', 'Bath']);
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['Overflowing Garbage / Waste', 'Trash2']);
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['Cleaning Chemical Shortage', 'Package']);
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['Equipment Breakdown', 'Wrench']);
    await runQuery('INSERT INTO issue_categories (name, icon) VALUES (?, ?)', ['General Facility Issue', 'AlertTriangle']);

    // Passwords hash generator
    const defaultPasswordHash = await bcrypt.hash('SriChaitanya2026!', 10);

    // Super Admin (Mobile: 6304261686 - compulsory requirement)
    await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `, ['Super Admin', '6304261686', 'superadmin@srichaitanya.net', defaultPasswordHash, 'SUPER_ADMIN']);

    // MD User
    await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `, ['Managing Director (MD)', '9900112233', 'md@srichaitanya.net', defaultPasswordHash, 'MD']);

    // GM User
    await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `, ['General Manager (GM)', '9900112244', 'gm@srichaitanya.net', defaultPasswordHash, 'GM']);

    // Executive User
    await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `, ['Chief Hygiene Executive', '9900112255', 'executive@srichaitanya.net', defaultPasswordHash, 'EXECUTIVE']);

    // Supervisor 1 (Assigned to Vizag Techno Campus)
    const sup1 = await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role, state_id, district_id, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Ramesh Kumar (Supervisor)', '9876543210', 'supervisor1@srichaitanya.net', defaultPasswordHash, 'SUPERVISOR', ap.lastID, vizag.lastID, b1.lastID]);

    // Supervisor 2 (Assigned to Hyderabad Olympiad School)
    const sup2 = await runQuery(`
      INSERT INTO users (name, mobile, email, password_hash, role, state_id, district_id, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Srinivas Rao (Supervisor)', '9876543211', 'supervisor2@srichaitanya.net', defaultPasswordHash, 'SUPERVISOR', ts.lastID, hyd.lastID, b3.lastID]);

    // Housekeeping Workers for Branch 1 (Vizag)
    const w1 = await runQuery(`INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id) VALUES (?, ?, ?, 3, 1)`, [b1.lastID, 'K. Lakshmi', 'EMP-VZG-001']);
    const w2 = await runQuery(`INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id) VALUES (?, ?, ?, 3, 1)`, [b1.lastID, 'M. Appala Raju', 'EMP-VZG-002']);
    const w3 = await runQuery(`INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id) VALUES (?, ?, ?, 4, 3)`, [b1.lastID, 'P. Venkat', 'EMP-VZG-003']);

    // Housekeeping Workers for Branch 3 (Hyderabad)
    const w4 = await runQuery(`INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id) VALUES (?, ?, ?, 3, 1)`, [b3.lastID, 'B. Yadagiri', 'EMP-HYD-001']);
    const w5 = await runQuery(`INSERT INTO workers (branch_id, name, employee_code, designation_id, department_id) VALUES (?, ?, ?, 3, 1)`, [b3.lastID, 'S. Anjaneyulu', 'EMP-HYD-002']);

    // Seed sample initial attendance for today
    const today = new Date().toISOString().split('T')[0];
    await runQuery(`
      INSERT INTO attendance (date, worker_id, branch_id, shift, check_in, check_out, status, remarks, recorded_by)
      VALUES (?, ?, ?, 'MORNING', '06:30 AM', '02:30 PM', 'PRESENT', 'On-time check-in verified', ?)
    `, [today, w1.lastID, b1.lastID, sup1.lastID]);

    await runQuery(`
      INSERT INTO attendance (date, worker_id, branch_id, shift, check_in, check_out, status, remarks, recorded_by)
      VALUES (?, ?, ?, 'MORNING', '06:35 AM', '02:30 PM', 'PRESENT', 'Routine morning shift', ?)
    `, [today, w2.lastID, b1.lastID, sup1.lastID]);

    // Seed sample work log
    await runQuery(`
      INSERT INTO work_logs (date, branch_id, worker_ids, category_id, area, description, start_time, completion_time, status, photos, remarks, recorded_by)
      VALUES (?, ?, ?, 1, 'Blocks A & B Classrooms', 'Sanitized 24 classrooms and wiped all blackboards', '07:00 AM', '09:30 AM', 'COMPLETED', '[]', 'All rooms sanitized with eco-grade disinfectant', ?)
    `, [today, b1.lastID, JSON.stringify([w1.lastID, w2.lastID]), sup1.lastID]);

    // Seed sample issue
    await runQuery(`
      INSERT INTO issues (ticket_no, branch_id, category_id, priority, description, status, reported_by)
      VALUES (?, ?, 1, 'HIGH', 'Water tap leakage in 2nd floor Boys Restroom Block-C', 'OPEN', ?)
    `, ['TKT-VZG-' + Math.floor(1000 + Math.random() * 9000), b1.lastID, sup1.lastID]);

    // System Settings
    await runQuery(`INSERT INTO system_settings (key, value) VALUES ('APP_NAME', 'REBUILD HYGIENE SYSTEMS')`);
    await runQuery(`INSERT INTO system_settings (key, value) VALUES ('ORG_NAME', 'SRI CHAITANYA EDUCATIONAL INSTITUTIONS')`);
    await runQuery(`INSERT INTO system_settings (key, value) VALUES ('OTP_EXPIRY_MINUTES', '5')`);
    await runQuery(`INSERT INTO system_settings (key, value) VALUES ('SUPER_ADMIN_MOBILE', '6304261686')`);

    console.log('Seed completed successfully!');
  }
}

export default db;
