const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.SESSION_SECRET || 'bhc-sports-secret-key-2024';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Database setup
const db = new Database('./bhc_sports.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS student_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    SAVED_TIME TEXT UNIQUE NOT NULL,
    ROLL_NO TEXT NOT NULL,
    NAME_OF_THE_GAME TEXT NOT NULL,
    NAME_OF_THE_SPORTSPERSON TEXT NOT NULL,
    FATHERS_NAME TEXT NOT NULL,
    MOTHER_NAME TEXT NOT NULL,
    DATE_OF_BIRTH TEXT NOT NULL,
    NAME_OF_EXAM TEXT,
    DATE_AND_YEAR TEXT,
    PRESENT_CLASS TEXT,
    NAME_OF_THE_PRESENT_CLASS TEXT,
    DURATION_OF_COURSE TEXT,
    UNIVERSITY TEXT,
    PRESENT_COURSE TEXT,
    GRADUATE_COURSE TEXT,
    P_G_COURSE TEXT,
    PREVIOUS_COURSE TEXT,
    ADDRESS TEXT,
    PHONE_NUMBER TEXT,
    image TEXT,
    GENDER TEXT NOT NULL,
    YEAR TEXT NOT NULL,
    AADHAR_NUMBER TEXT,
    TOURNAMENT TEXT,
    TSHIRT TEXT,
    TRACK TEXT,
    status TEXT DEFAULT 'pending'
  );
`);

// Seed default admin user
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', hashed, 'admin');
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG/PNG allowed'));
  }
});

// ─── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'No user found' });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ message: 'Password changed successfully' });
});

// ─── STUDENT ROUTES ────────────────────────────────────────────────────────────
app.get('/api/students', authMiddleware, (req, res) => {
  const { rollNo, name, game, gender, department, year, status } = req.query;
  let query = 'SELECT * FROM student_details WHERE 1=1';
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' AND status = ?';
    params.push('approved');
  } else if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (rollNo) { query += ' AND ROLL_NO LIKE ?'; params.push(`%${rollNo}%`); }
  if (name) { query += ' AND NAME_OF_THE_SPORTSPERSON LIKE ?'; params.push(`%${name}%`); }
  if (game) { query += ' AND NAME_OF_THE_GAME = ?'; params.push(game); }
  if (gender) { query += ' AND GENDER = ?'; params.push(gender); }
  if (department) { query += ' AND NAME_OF_THE_PRESENT_CLASS = ?'; params.push(department); }
  if (year) { query += ' AND YEAR = ?'; params.push(year); }

  query += ' ORDER BY id DESC';
  const students = db.prepare(query).all(...params);
  res.json(students);
});

app.get('/api/students/meta', authMiddleware, (req, res) => {
  const departments = db.prepare("SELECT DISTINCT NAME_OF_THE_PRESENT_CLASS FROM student_details WHERE NAME_OF_THE_PRESENT_CLASS IS NOT NULL ORDER BY NAME_OF_THE_PRESENT_CLASS").all().map(r => r.NAME_OF_THE_PRESENT_CLASS);
  const years = db.prepare("SELECT DISTINCT YEAR FROM student_details WHERE YEAR IS NOT NULL ORDER BY YEAR DESC").all().map(r => r.YEAR);
  const games = db.prepare("SELECT DISTINCT NAME_OF_THE_GAME FROM student_details WHERE NAME_OF_THE_GAME IS NOT NULL ORDER BY NAME_OF_THE_GAME").all().map(r => r.NAME_OF_THE_GAME);
  res.json({ departments, years, games });
});

app.get('/api/students/:id', authMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM student_details WHERE SAVED_TIME = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

app.post('/api/students', authMiddleware, upload.single('image'), (req, res) => {
  const d = req.body;
  const savedTime = new Date().toISOString().replace(/[:.]/g, '-');

  // Check duplicate
  const existing = db.prepare(
    'SELECT id FROM student_details WHERE ROLL_NO = ? AND NAME_OF_THE_PRESENT_CLASS = ? AND YEAR = ? AND NAME_OF_THE_GAME = ?'
  ).get(d.rollNo, d.nameOfThePresentClass, d.year, d.nameOfTheGame);

  if (existing) {
    return res.status(409).json({ error: 'Student with same Roll No, Department, Year and Game already exists.' });
  }

  const imageFile = req.file ? req.file.filename : null;
  const status = req.user.role === 'admin' ? 'approved' : 'pending';

  db.prepare(`
    INSERT INTO student_details (SAVED_TIME, ROLL_NO, NAME_OF_THE_GAME, NAME_OF_THE_SPORTSPERSON,
      FATHERS_NAME, MOTHER_NAME, DATE_OF_BIRTH, NAME_OF_EXAM, DATE_AND_YEAR,
      PRESENT_CLASS, NAME_OF_THE_PRESENT_CLASS, DURATION_OF_COURSE, UNIVERSITY,
      PRESENT_COURSE, GRADUATE_COURSE, P_G_COURSE, PREVIOUS_COURSE, ADDRESS,
      PHONE_NUMBER, image, GENDER, YEAR, AADHAR_NUMBER, TOURNAMENT, TSHIRT, TRACK, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    savedTime, d.rollNo, d.nameOfTheGame, d.studentName,
    d.fatherName, d.motherName, d.dob, d.nameOfExam, d.dateAndYear,
    d.presentClass, d.nameOfThePresentClass, d.durationOfCourse, d.university,
    d.presentCourse, d.graduateCourse, d.pgCourse, d.previousCourse, d.address,
    d.phoneNumber, imageFile, d.gender, d.year, d.aadharNumber, d.tournament, d.tshirt, d.track,
    status
  );

  res.json({ message: status === 'approved' ? 'Student created successfully' : 'Student submitted for approval', savedTime });
});

app.put('/api/students/:id', authMiddleware, upload.single('image'), (req, res) => {
  const d = req.body;
  const student = db.prepare('SELECT * FROM student_details WHERE SAVED_TIME = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const imageFile = req.file ? req.file.filename : student.image;

  // Delete old image if new one uploaded
  if (req.file && student.image) {
    const oldPath = path.join(__dirname, 'uploads', student.image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare(`
    UPDATE student_details SET
      ROLL_NO=?, NAME_OF_THE_GAME=?, NAME_OF_THE_SPORTSPERSON=?, FATHERS_NAME=?,
      MOTHER_NAME=?, DATE_OF_BIRTH=?, NAME_OF_EXAM=?, DATE_AND_YEAR=?,
      PRESENT_CLASS=?, NAME_OF_THE_PRESENT_CLASS=?, DURATION_OF_COURSE=?,
      UNIVERSITY=?, PRESENT_COURSE=?, GRADUATE_COURSE=?, P_G_COURSE=?,
      PREVIOUS_COURSE=?, ADDRESS=?, PHONE_NUMBER=?, image=?, GENDER=?,
      YEAR=?, AADHAR_NUMBER=?, TOURNAMENT=?, TSHIRT=?, TRACK=?
    WHERE SAVED_TIME=?
  `).run(
    d.rollNo, d.nameOfTheGame, d.studentName, d.fatherName,
    d.motherName, d.dob, d.nameOfExam, d.dateAndYear,
    d.presentClass, d.nameOfThePresentClass, d.durationOfCourse,
    d.university, d.presentCourse, d.graduateCourse, d.pgCourse,
    d.previousCourse, d.address, d.phoneNumber, imageFile, d.gender,
    d.year, d.aadharNumber, d.tournament, d.tshirt, d.track,
    req.params.id
  );

  res.json({ message: 'Student updated successfully' });
});

app.delete('/api/students/:id', authMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM student_details WHERE SAVED_TIME = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (student.image) {
    const imgPath = path.join(__dirname, 'uploads', student.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.prepare('DELETE FROM student_details WHERE SAVED_TIME = ?').run(req.params.id);
  res.json({ message: 'Student deleted successfully' });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/admin/pending', authMiddleware, adminMiddleware, (req, res) => {
  const students = db.prepare("SELECT * FROM student_details WHERE status = 'pending' ORDER BY id DESC").all();
  res.json(students);
});

app.post('/api/admin/approve/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare("UPDATE student_details SET status = 'approved' WHERE SAVED_TIME = ?").run(req.params.id);
  res.json({ message: 'Student approved successfully' });
});

app.post('/api/admin/reject/:id', authMiddleware, adminMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM student_details WHERE SAVED_TIME = ?').get(req.params.id);
  if (student?.image) {
    const imgPath = path.join(__dirname, 'uploads', student.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM student_details WHERE SAVED_TIME = ?').run(req.params.id);
  res.json({ message: 'Student rejected and removed' });
});

// Dashboard stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM student_details").get().count;
  const approved = db.prepare("SELECT COUNT(*) as count FROM student_details WHERE status='approved'").get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM student_details WHERE status='pending'").get().count;
  const games = db.prepare("SELECT COUNT(DISTINCT NAME_OF_THE_GAME) as count FROM student_details").get().count;
  res.json({ total, approved, pending, games });
});

// Users management (admin)
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users ORDER BY id").all();
  res.json(users);
});

app.post('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already exists' });
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hashed, role || 'user');
  res.json({ message: 'User created successfully' });
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BHC Sports API running on port ${PORT}`);
});
