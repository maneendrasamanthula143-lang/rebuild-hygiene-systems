import jwt from 'jsonwebtoken';
import { runQuery, getQuery } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sri_chaitanya_rebuild_hygiene_production_secret_key_2026_x89a';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      state_id: user.state_id,
      district_id: user.district_id,
      branch_id: user.branch_id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated user.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record security audit event
      logAudit(req.user.id, req.user.name, req.user.role, 'UNAUTHORIZED_ROLE_ACCESS', 'SECURITY', null, {
        attemptedRole: allowedRoles,
        url: req.originalUrl,
        ip: req.ip
      });

      return res.status(403).json({
        error: `Access Denied. Role '${req.user.role}' is not authorized to perform this operation.`
      });
    }

    next();
  };
}

// Strict Branch Access Guard: Supervisors can ONLY access data from their assigned branch
export function enforceBranchAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

  // Management roles have broader scope according to their permissions
  if (['SUPER_ADMIN', 'MD', 'GM', 'EXECUTIVE'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role === 'SUPERVISOR') {
    const targetBranchId = req.params.branch_id || req.query.branch_id || req.body.branch_id;

    if (targetBranchId && parseInt(targetBranchId, 10) !== req.user.branch_id) {
      logAudit(req.user.id, req.user.name, req.user.role, 'UNAUTHORIZED_BRANCH_ACCESS_ATTEMPT', 'BRANCH', targetBranchId, {
        userBranch: req.user.branch_id,
        requestedBranch: targetBranchId,
        url: req.originalUrl
      });

      return res.status(403).json({
        error: 'Forbidden. Supervisors are restricted to accessing data for their assigned branch only.'
      });
    }
  }

  next();
}

export async function logAudit(userId, userName, role, action, recordType, recordId = null, details = {}) {
  try {
    await runQuery(
      `INSERT INTO audit_logs (user_id, user_name, role, action, record_type, record_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        userName || 'System',
        role || 'SYSTEM',
        action,
        recordType,
        recordId || null,
        JSON.stringify(details)
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
