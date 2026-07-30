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

// Ensure upload directories exist
if (!fs.existsSync('./uploads'))             fs.mkdirSync('./uploads');
if (!fs.existsSync('./uploads/aadhaar'))     fs.mkdirSync('./uploads/aadhaar');
if (!fs.existsSync('./uploads/idcard'))      fs.mkdirSync('./uploads/idcard');
if (!fs.existsSync('./uploads/marksheet'))   fs.mkdirSync('./uploads/marksheet');

// ─── MONGOOSE MODELS ──────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'user' }
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  savedTime:             { type: String, unique: true, required: true },
  rollNo:                { type: String, required: true },
  nameOfTheGame:         { type: String, required: true },
  nameOfTheSportsperson: { type: String, required: true },
  fathersName:           String,
  motherName:            String,
  dateOfBirth:           String,
  nameOfExam:            String,
  dateAndYear:           String,
  presentClass:          String,
  nameOfThePresentClass: String,
  durationOfCourse:      String,
  university:            String,
  presentCourse:         String,
  graduateCourse:        String,
  pgCourse:              String,
  previousCourse:        String,
  address:               String,
  phoneNumber:           String,
  image:                 String,
  bloodGroup:            String,
  gender:                { type: String, required: true },
  year:                  { type: String, required: true },
  aadharNumber:          String,
  aadhaarPdf:            String,
  idCardPdf:             String,
  marksheetPdf:          String,
  tournament:            String,
  tshirt:                String,
  track:                 String,
  studentType:           String,
  dayType:               String,
  hostelName:            String,
  status:                { type: String, default: 'approved', enum: ['pending', 'approved'] }
}, { timestamps: true });

const User    = mongoose.model('User', UserSchema);
const Student = mongoose.model('Student', StudentSchema);

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────

const SAMPLE_STUDENTS = [
  {
    rollNo: '22CS001', nameOfTheGame: 'CRICKET', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Arjun Kumar', fathersName: 'Suresh Kumar', motherName: 'Meena Kumar',
    dateOfBirth: '2002-03-15', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'COMPUTER SCIENCE', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Computer Science',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'Participated in 2022 District level',
    address: '12, Anna Nagar, Tiruchirappalli - 620001', phoneNumber: '9876543210',
    aadharNumber: '234567890123', tournament: '5', tshirt: '40', track: '42', status: 'approved'
  },
  {
    rollNo: '22PH002', nameOfTheGame: 'BADMINTON', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Priya Sharma', fathersName: 'Ramesh Sharma', motherName: 'Sudha Sharma',
    dateOfBirth: '2003-07-22', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'II Year', nameOfThePresentClass: 'PHYSICS', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Physics',
    graduateCourse: '1', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '45, Gandhi Road, Thanjavur - 613001', phoneNumber: '9865432101',
    aadharNumber: '345678901234', tournament: '3', tshirt: '36', track: '38', status: 'approved'
  },
  {
    rollNo: '21MA003', nameOfTheGame: 'FOOTBALL', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Rahul Verma', fathersName: 'Anil Verma', motherName: 'Sunita Verma',
    dateOfBirth: '2001-11-08', nameOfExam: 'HSC', dateAndYear: 'April 2019',
    presentClass: 'IV Year', nameOfThePresentClass: 'MATHEMATICS', durationOfCourse: '4 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Mathematics',
    graduateCourse: '3', pgCourse: 'NIL', previousCourse: 'State level participant 2022',
    address: '78, Nehru Street, Madurai - 625001', phoneNumber: '9754321098',
    aadharNumber: '456789012345', tournament: '7', tshirt: '42', track: '44', status: 'approved'
  },
  {
    rollNo: '23CH004', nameOfTheGame: 'VOLLEYBALL', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Anitha Devi', fathersName: 'Muthu Devi', motherName: 'Latha Devi',
    dateOfBirth: '2003-01-30', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'CHEMISTRY', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Chemistry',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '23, Raja Street, Tiruchirappalli - 620002', phoneNumber: '9643210987',
    aadharNumber: '567890123456', tournament: '4', tshirt: '34', track: '36', status: 'approved'
  },
  {
    rollNo: '22CO005', nameOfTheGame: 'BASKETBALL', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Vijay Rajan', fathersName: 'Selvam Rajan', motherName: 'Kamala Rajan',
    dateOfBirth: '2002-09-14', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'COMMERCE', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Com',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'College level champion 2022',
    address: '56, Market Road, Kumbakonam - 612001', phoneNumber: '9532109876',
    aadharNumber: '678901234567', tournament: '8', tshirt: '44', track: '46', status: 'approved'
  },
  {
    rollNo: '22HI006', nameOfTheGame: 'TABLE TENNIS', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Deepa Nair', fathersName: 'Gopalan Nair', motherName: 'Saritha Nair',
    dateOfBirth: '2002-05-19', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'HISTORY', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A History',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '89, Lake View, Trichy - 620020', phoneNumber: '9421098765',
    aadharNumber: '789012345678', tournament: '2', tshirt: '36', track: '38', status: 'approved'
  },
  {
    rollNo: '21BI007', nameOfTheGame: 'ATHLETICS', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Suresh Babu', fathersName: 'Babu Raja', motherName: 'Geetha Babu',
    dateOfBirth: '2001-08-25', nameOfExam: 'HSC', dateAndYear: 'April 2019',
    presentClass: 'IV Year', nameOfThePresentClass: 'BIOLOGY', durationOfCourse: '4 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Biology',
    graduateCourse: '3', pgCourse: 'NIL', previousCourse: 'National level 100m 2022',
    address: '34, Temple Street, Thanjavur - 613002', phoneNumber: '9310987654',
    aadharNumber: '890123456789', tournament: '1', tshirt: '40', track: '42', status: 'approved'
  },
  {
    rollNo: '23TA008', nameOfTheGame: 'CHESS', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Kavitha Murugan', fathersName: 'Murugan Vel', motherName: 'Ponni Murugan',
    dateOfBirth: '2003-12-03', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'TAMIL', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A Tamil',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'District champion 2021',
    address: '67, Palani Road, Dindigul - 624001', phoneNumber: '9209876543',
    aadharNumber: '901234567890', tournament: '6', tshirt: '34', track: '36', status: 'approved'
  },
  {
    rollNo: '22EN009', nameOfTheGame: 'HOCKEY', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Manoj Kumar', fathersName: 'Ramkumar S', motherName: 'Vimala Ramkumar',
    dateOfBirth: '2002-04-11', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'ENGLISH', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A English',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'Inter-university 2022',
    address: '11, Church Road, Salem - 636001', phoneNumber: '9098765432',
    aadharNumber: '012345678901', tournament: '9', tshirt: '42', track: '44', status: 'approved'
  },
  {
    rollNo: '23MB010', nameOfTheGame: 'SWIMMING', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Lakshmi Priya', fathersName: 'Venkatesh P', motherName: 'Revathi Venkatesh',
    dateOfBirth: '2003-06-17', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'MANAGEMENT', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'BBA',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'State swimmer of the year 2021',
    address: '99, Beach Road, Chennai - 600001', phoneNumber: '8987654321',
    aadharNumber: '123456789012', tournament: '10', tshirt: '34', track: '36', status: 'approved'
  }
];

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────────

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('📦  No MONGODB_URI found — starting local in-memory MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('✅  In-memory MongoDB started (data resets on server restart)');
    console.log('💡  To persist data, add MONGODB_URI as a Replit Secret (MongoDB Atlas)');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅  MongoDB connected');

    // Seed admin user
    const adminExists = await User.countDocuments({ username: 'admin' });
    if (!adminExists) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await User.create({ username: 'admin', password: hashed, role: 'admin' });
      console.log('🔑  Default admin created — admin / admin123');
    }

    // Seed sample students
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      const docs = SAMPLE_STUDENTS.map((s, i) => ({
        savedTime: `seed-${Date.now()}-${i}`,
        rollNo:                s.rollNo,
        nameOfTheGame:         s.nameOfTheGame,
        nameOfTheSportsperson: s.nameOfTheSportsperson,
        fathersName:           s.fathersName,
        motherName:            s.motherName,
        dateOfBirth:           s.dateOfBirth,
        nameOfExam:            s.nameOfExam,
        dateAndYear:           s.dateAndYear,
        presentClass:          s.presentClass,
        nameOfThePresentClass: s.nameOfThePresentClass,
        durationOfCourse:      s.durationOfCourse,
        university:            s.university,
        presentCourse:         s.presentCourse,
        graduateCourse:        s.graduateCourse,
        pgCourse:              s.pgCourse,
        previousCourse:        s.previousCourse,
        address:               s.address,
        phoneNumber:           s.phoneNumber,
        gender:                s.gender,
        year:                  s.year,
        aadharNumber:          s.aadharNumber,
        tournament:            s.tournament,
        tshirt:                s.tshirt,
        track:                 s.track,
        status:                'approved',
      }));
      await Student.insertMany(docs);
      console.log(`🌱  Seeded ${docs.length} sample students`);
    }
  } catch (err) {
    console.error('❌  MongoDB error:', err.message);
    process.exit(1);
  }
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

const uploadFields = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'aadhaarPdf')    cb(null, './uploads/aadhaar/');
      else if (file.fieldname === 'idCardPdf')    cb(null, './uploads/idcard/');
      else if (file.fieldname === 'marksheetPdf') cb(null, './uploads/marksheet/');
      else cb(null, './uploads/');
    },
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'aadhaarPdf' || file.fieldname === 'idCardPdf' || file.fieldname === 'marksheetPdf') {
      const ext = path.extname(file.originalname).toLowerCase();
      ext === '.pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
    } else {
      const ext = path.extname(file.originalname).toLowerCase();
      ['.jpg', '.jpeg', '.png'].includes(ext) ? cb(null, true) : cb(new Error('Only JPG/PNG allowed'));
    }
  }
}).fields([
  { name: 'image',      maxCount: 1 },
  { name: 'aadhaarPdf',    maxCount: 1 },
  { name: 'idCardPdf',     maxCount: 1 },
  { name: 'marksheetPdf',  maxCount: 1 },
]);

// ─── IMAGE PROXY ──────────────────────────────────────────────────────────────

app.get('/api/proxy-image', authMiddleware, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return res.status(404).json({ error: 'Image not found at remote URL' });
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach image server: ' + err.message });
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
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── STUDENT ROUTES ───────────────────────────────────────────────────────────

app.get('/api/students', authMiddleware, async (req, res) => {
  try {
    const { rollNo, name, game, gender, department, year, status } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') filter.status = 'approved';
    else if (status) filter.status = status;
    if (rollNo)     filter.rollNo               = { $regex: rollNo, $options: 'i' };
    if (name)       filter.nameOfTheSportsperson = { $regex: name, $options: 'i' };
    if (game)       filter.nameOfTheGame         = game;
    if (gender)     filter.gender               = gender;
    if (department) filter.nameOfThePresentClass = department;
    if (year)       filter.year                 = year;
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students', authMiddleware, uploadFields, async (req, res) => {
  try {
    const d = req.body;
    const imageFile   = req.files?.image?.[0];
    const aadhaarFile = req.files?.aadhaarPdf?.[0];
    const idCardFile  = req.files?.idCardPdf?.[0];
    const marksheetFile = req.files?.marksheetPdf?.[0];
    // Validate idcard size (100 KB – 1 MB)
    if (idCardFile) {
      if (idCardFile.size < 100 * 1024) return res.status(400).json({ error: 'ID card PDF too small (min 100 KB)' });
      if (idCardFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'ID card PDF too large (max 1 MB)' });
    }
    // Validate marksheet size (100 KB – 1 MB)
    if (marksheetFile) {
      if (marksheetFile.size < 100 * 1024) return res.status(400).json({ error: 'Marksheet PDF too small (min 100 KB)' });
      if (marksheetFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'Marksheet PDF too large (max 1 MB)' });
    }
    const savedTime = new Date().toISOString().replace(/[:.]/g, '-');
    const existing = await Student.findOne({
      rollNo: d.rollNo, nameOfThePresentClass: d.nameOfThePresentClass,
      year: d.year, nameOfTheGame: d.nameOfTheGame,
    });
    if (existing) return res.status(409).json({ error: 'Student with same Roll No, Department, Year and Game already exists.' });
    const student = await Student.create({
      savedTime, rollNo: d.rollNo, nameOfTheGame: d.nameOfTheGame,
      nameOfTheSportsperson: d.studentName, fathersName: d.fatherName,
      motherName: d.motherName, dateOfBirth: d.dob, nameOfExam: d.nameOfExam,
      dateAndYear: d.dateAndYear, presentClass: d.presentClass,
      nameOfThePresentClass: d.nameOfThePresentClass, durationOfCourse: d.durationOfCourse,
      university: d.university, presentCourse: d.presentCourse,
      graduateCourse: d.graduateCourse, pgCourse: d.pgCourse, previousCourse: d.previousCourse,
      address: d.address, phoneNumber: d.phoneNumber,
      image: imageFile?.filename || null,
      aadhaarPdf:    aadhaarFile    ? `aadhaar/${aadhaarFile.filename}`      : null,
      idCardPdf:     idCardFile     ? `idcard/${idCardFile.filename}`        : null,
      marksheetPdf:  marksheetFile  ? `marksheet/${marksheetFile.filename}`  : null,
      gender: d.gender, year: d.year, aadharNumber: d.aadharNumber,
      tournament: d.tournament, tshirt: d.tshirt, track: d.track,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
    });
    const msg = student.status === 'approved' ? 'Student created successfully' : 'Student submitted for approval';
    res.json({ message: msg, savedTime });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/students/:id', authMiddleware, uploadFields, async (req, res) => {
  try {
    const d = req.body;
    const imageFile   = req.files?.image?.[0];
    const aadhaarFile = req.files?.aadhaarPdf?.[0];
    const idCardFile    = req.files?.idCardPdf?.[0];
    const marksheetFile = req.files?.marksheetPdf?.[0];
    if (idCardFile) {
      if (idCardFile.size < 100 * 1024) return res.status(400).json({ error: 'ID card PDF too small (min 100 KB)' });
      if (idCardFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'ID card PDF too large (max 1 MB)' });
    }
    if (marksheetFile) {
      if (marksheetFile.size < 100 * 1024) return res.status(400).json({ error: 'Marksheet PDF too small (min 100 KB)' });
      if (marksheetFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'Marksheet PDF too large (max 1 MB)' });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    // Remove old photo if replaced
    if (imageFile && student.image) {
      const old = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    // Remove old aadhaar PDF if replaced
    if (aadhaarFile && student.aadhaarPdf) {
      const old = path.join(__dirname, 'uploads', student.aadhaarPdf);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    // Remove old ID card PDF if replaced
    if (idCardFile && student.idCardPdf) {
      const old = path.join(__dirname, 'uploads', student.idCardPdf);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    // Remove old marksheet PDF if replaced
    if (marksheetFile && student.marksheetPdf) {
      const old = path.join(__dirname, 'uploads', student.marksheetPdf);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    Object.assign(student, {
      rollNo: d.rollNo, nameOfTheGame: d.nameOfTheGame,
      nameOfTheSportsperson: d.studentName, fathersName: d.fatherName,
      motherName: d.motherName, dateOfBirth: d.dob, nameOfExam: d.nameOfExam,
      dateAndYear: d.dateAndYear, presentClass: d.presentClass,
      nameOfThePresentClass: d.nameOfThePresentClass, durationOfCourse: d.durationOfCourse,
      university: d.university, presentCourse: d.presentCourse,
      graduateCourse: d.graduateCourse, pgCourse: d.pgCourse, previousCourse: d.previousCourse,
      address: d.address, phoneNumber: d.phoneNumber,
      image:         imageFile     ? imageFile.filename                      : student.image,
      aadhaarPdf:    aadhaarFile   ? `aadhaar/${aadhaarFile.filename}`       : student.aadhaarPdf,
      idCardPdf:     idCardFile    ? `idcard/${idCardFile.filename}`          : student.idCardPdf,
      marksheetPdf:  marksheetFile ? `marksheet/${marksheetFile.filename}`   : student.marksheetPdf,
      gender: d.gender, year: d.year, aadharNumber: d.aadharNumber,
      tournament: d.tournament, tshirt: d.tshirt, track: d.track,
    });
    await student.save();
    res.json({ message: 'Student updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/students/:id/aadhaar', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.aadhaarPdf) {
      const filePath = path.join(__dirname, 'uploads', student.aadhaarPdf);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      student.aadhaarPdf = null;
      await student.save();
    }
    res.json({ message: 'Aadhaar PDF deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/students/:id/idcard', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.idCardPdf) {
      const filePath = path.join(__dirname, 'uploads', student.idCardPdf);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      student.idCardPdf = null;
      await student.save();
    }
    res.json({ message: 'ID card PDF deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/students/:id/marksheet', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.marksheetPdf) {
      const filePath = path.join(__dirname, 'uploads', student.marksheetPdf);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      student.marksheetPdf = null;
      await student.save();
    }
    res.json({ message: 'Marksheet PDF deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.image) {
      const imgPath = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'No IDs provided' });
    const students = await Student.find({ _id: { $in: ids } });
    for (const s of students) {
      if (s.image) {
        const imgPath = path.join(__dirname, 'uploads', s.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      await s.deleteOne();
    }
    res.json({ message: `${students.length} student(s) deleted` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.get('/api/admin/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/approve/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ message: 'Student approved successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/reject/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student?.image) {
      const imgPath = path.join(__dirname, 'uploads', student.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await student?.deleteOne();
    res.json({ message: 'Student rejected and removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [total, approved, pending, gamesArr] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'approved' }),
      Student.countDocuments({ status: 'pending' }),
      Student.distinct('nameOfTheGame'),
    ]);
    res.json({ total, approved, pending, games: gamesArr.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (await User.findOne({ username })) return res.status(409).json({ error: 'Username already exists' });
    await User.create({ username, password: bcrypt.hashSync(password, 10), role: role || 'user' });
    res.json({ message: 'User created successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
