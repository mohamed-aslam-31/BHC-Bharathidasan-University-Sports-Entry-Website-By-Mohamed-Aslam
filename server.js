const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.SESSION_SECRET || 'bhc-sports-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI;

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// ─── MONGOOSE MODELS ──────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'user' }
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  savedTime:              { type: String, unique: true, required: true },
  rollNo:                 { type: String, required: true },
  nameOfTheGame:          { type: String, required: true },
  nameOfTheSportsperson:  { type: String, required: true },
  fathersName:            String,
  motherName:             String,
  dateOfBirth:            String,
  nameOfExam:             String,
  dateAndYear:            String,
  presentClass:           String,
  nameOfThePresentClass:  String,
  durationOfCourse:       String,
  university:             String,
  presentCourse:          String,
  graduateCourse:         String,
  pgCourse:               String,
  previousCourse:         String,
  address:                String,
  phoneNumber:            String,
  image:                  String,
  gender:                 { type: String, required: true },
  year:                   { type: String, required: true },
  aadharNumber:           String,
  tournament:             String,
  tshirt:                 String,
  track:                  String,
  status:                 { type: String, default: 'pending', enum: ['pending', 'approved'] }
}, { timestamps: true });

const User    = mongoose.model('User', UserSchema);
const Student = mongoose.model('Student', StudentSchema);

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────────

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set. Please add it as a Replit Secret.');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅  MongoDB connected');

    // Seed default admin if none exists
    const count = await User.countDocuments({ username: 'admin' });
    if (count === 0) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await User.create({ username: 'admin', password: hashed, role: 'admin' });
      console.log('🔑  Default admin user created (admin / admin123)');
    }
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.jpg', '.jpeg', '.png'].includes(ext) ? cb(null, true) : cb(new Error('Only JPG/PNG allowed'));
  }
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'No user found' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT ROUTES ───────────────────────────────────────────────────────────

app.get('/api/students', authMiddleware, async (req, res) => {
  try {
    const { rollNo, name, game, gender, department, year, status } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.status = 'approved';
    } else if (status) {
      filter.status = status;
    }

    if (rollNo)      filter.rollNo               = { $regex: rollNo,      $options: 'i' };
    if (name)        filter.nameOfTheSportsperson = { $regex: name,        $options: 'i' };
    if (game)        filter.nameOfTheGame         = game;
    if (gender)      filter.gender               = gender;
    if (department)  filter.nameOfThePresentClass = department;
    if (year)        filter.year                 = year;

    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/meta', authMiddleware, async (req, res) => {
  try {
    const [departments, years, games] = await Promise.all([
      Student.distinct('nameOfThePresentClass'),
      Student.distinct('year'),
      Student.distinct('nameOfTheGame'),
    ]);
    res.json({
      departments: departments.filter(Boolean).sort(),
      years:       years.filter(Boolean).sort((a, b) => b.localeCompare(a)),
      games:       games.filter(Boolean).sort(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ savedTime: req.params.id }).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const d = req.body;
    const savedTime = new Date().toISOString().replace(/[:.]/g, '-');

    // Duplicate check
    const existing = await Student.findOne({
      rollNo:               d.rollNo,
      nameOfThePresentClass: d.nameOfThePresentClass,
      year:                 d.year,
      nameOfTheGame:        d.nameOfTheGame,
    });
    if (existing) return res.status(409).json({ error: 'Student with same Roll No, Department, Year and Game already exists.' });

    const student = await Student.create({
      savedTime,
      rollNo:               d.rollNo,
      nameOfTheGame:        d.nameOfTheGame,
      nameOfTheSportsperson: d.studentName,
      fathersName:          d.fatherName,
      motherName:           d.motherName,
      dateOfBirth:          d.dob,
      nameOfExam:           d.nameOfExam,
      dateAndYear:          d.dateAndYear,
      presentClass:         d.presentClass,
      nameOfThePresentClass: d.nameOfThePresentClass,
      durationOfCourse:     d.durationOfCourse,
      university:           d.university,
      presentCourse:        d.presentCourse,
      graduateCourse:       d.graduateCourse,
      pgCourse:             d.pgCourse,
      previousCourse:       d.previousCourse,
      address:              d.address,
      phoneNumber:          d.phoneNumber,
      image:                req.file?.filename || null,
      gender:               d.gender,
      year:                 d.year,
      aadharNumber:         d.aadharNumber,
      tournament:           d.tournament,
      tshirt:               d.tshirt,
      track:                d.track,
      status:               req.user.role === 'admin' ? 'approved' : 'pending',
    });

    const msg = student.status === 'approved' ? 'Student created successfully' : 'Student submitted for approval';
    res.json({ message: msg, savedTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const d = req.body;
    const student = await Student.findOne({ savedTime: req.params.id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (req.file && student.image) {
      const old = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    Object.assign(student, {
      rollNo:               d.rollNo,
      nameOfTheGame:        d.nameOfTheGame,
      nameOfTheSportsperson: d.studentName,
      fathersName:          d.fatherName,
      motherName:           d.motherName,
      dateOfBirth:          d.dob,
      nameOfExam:           d.nameOfExam,
      dateAndYear:          d.dateAndYear,
      presentClass:         d.presentClass,
      nameOfThePresentClass: d.nameOfThePresentClass,
      durationOfCourse:     d.durationOfCourse,
      university:           d.university,
      presentCourse:        d.presentCourse,
      graduateCourse:       d.graduateCourse,
      pgCourse:             d.pgCourse,
      previousCourse:       d.previousCourse,
      address:              d.address,
      phoneNumber:          d.phoneNumber,
      image:                req.file ? req.file.filename : student.image,
      gender:               d.gender,
      year:                 d.year,
      aadharNumber:         d.aadharNumber,
      tournament:           d.tournament,
      tshirt:               d.tshirt,
      track:                d.track,
    });

    await student.save();
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ savedTime: req.params.id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.image) {
      const imgPath = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.get('/api/admin/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/approve/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Student.findOneAndUpdate({ savedTime: req.params.id }, { status: 'approved' });
    res.json({ message: 'Student approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reject/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ savedTime: req.params.id });
    if (student?.image) {
      const imgPath = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await student?.deleteOne();
    res.json({ message: 'Student rejected and removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [total, approved, pending, games] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'approved' }),
      Student.countDocuments({ status: 'pending' }),
      Student.distinct('nameOfTheGame').then(a => a.length),
    ]);
    res.json({ total, approved, pending, games });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already exists' });
    const hashed = bcrypt.hashSync(password, 10);
    await User.create({ username, password: hashed, role: role || 'user' });
    res.json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PRODUCTION STATIC ────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
}

// ─── START ────────────────────────────────────────────────────────────────────

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀  BHC Sports API running on port ${PORT}`);
  });
});
