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
if (!fs.existsSync('./uploads/marksheet'))    fs.mkdirSync('./uploads/marksheet');
if (!fs.existsSync('./uploads/feesreceipt')) fs.mkdirSync('./uploads/feesreceipt');
if (!fs.existsSync('./uploads/drafts'))      fs.mkdirSync('./uploads/drafts');
if (!fs.existsSync('./uploads/avatars'))     fs.mkdirSync('./uploads/avatars');

// ─── MONGOOSE MODELS ──────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'user' },
  avatar:   { type: String, default: null }
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
  feesReceiptPdf:        String,
  tshirt:                String,
  track:                 String,
  shift:                 String,
  studentType:           String,
  dayType:               String,
  hostelName:            String,
  status:                { type: String, default: 'approved', enum: ['pending', 'approved'] },
  documentsVerified:     { type: Boolean, default: false }
}, { timestamps: true });

const OptionListSchema = new mongoose.Schema({
  key:    { type: String, unique: true, required: true },
  values: { type: [String], default: [] },
}, { timestamps: true });

const SelfRegAccessSchema = new mongoose.Schema({
  rollNo:      { type: String, required: true },
  nameOfGame:  { type: String, required: true },
  year:        { type: String, required: true },
  createdBy:   { type: String, default: 'admin' },
}, { timestamps: true });

const User          = mongoose.model('User', UserSchema);
const Student       = mongoose.model('Student', StudentSchema);
const OptionList    = mongoose.model('OptionList', OptionListSchema);
const SelfRegAccess = mongoose.model('SelfRegAccess', SelfRegAccessSchema);

// ─── DEFAULT COMBO-BOX OPTION LISTS ────────────────────────────────────────────
// Single source of truth, seeded into OptionList on first run. The dashboard
// filters and the add/edit student forms all read from OptionList via
// GET /api/options, so renaming or deleting an option anywhere updates it
// everywhere.
const DEFAULT_OPTION_LISTS = {
  year: (() => {
    const list = [];
    for (let y = 2020; y <= 2039; y++) list.push(`${y}-${y + 1}`);
    return list;
  })(),
  game: [
    'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
    'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
    'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
    'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE',
  ],
  dept: [],
  university: [
    'Bharathidasan University','University of Madras','Anna University',
    'Madurai Kamaraj University','Bharathiar University','Annamalai University',
    'Manonmaniam Sundaranar University','Periyar University',
    'Mother Teresa Women\'s University','Tamil Nadu Open University',
  ],
  class: [
    'I B.A','II B.A','III B.A','I B.Sc','II B.Sc','III B.Sc',
    'I B.Com','II B.Com','III B.Com','I B.C.A','II B.C.A','III B.C.A',
    'I B.B.A','II B.B.A','III B.B.A','I B.COM(CA)','II B.COM(CA)','III B.COM(CA)',
    'I B.Ed','II B.Ed','I B.P.Ed','II B.P.Ed','I M.A','II M.A','I M.Sc','II M.Sc',
    'I M.Com','II M.Com','I M.B.A','II M.B.A','I M.C.A','II M.C.A','I M.Ed','II M.Ed',
    'I M.P.Ed','II M.P.Ed','I Ph.D','II Ph.D','III Ph.D',
  ],
  duration: ['1 Year','2 Years','3 Years','4 Years','5 Years'],
  iut: ['NIL','1 Year','2 Years','3 Years','4 Years','5 Years'],
  course: [
    'B.A English','B.A Tamil','B.A History','B.A Economics','B.A Sociology',
    'B.Sc Mathematics','B.Sc Physics','B.Sc Chemistry','B.Sc Biology',
    'B.Sc Computer Science','B.Sc Statistics','B.Sc Biochemistry',
    'B.Com','B.Com (CA)','B.Com (CS)','BBA','BCA','B.Ed','B.P.Ed',
    'M.A English','M.A Tamil','M.A History','M.A Economics',
    'M.Sc Mathematics','M.Sc Physics','M.Sc Chemistry','M.Sc Computer Science',
    'M.Com','MBA','MCA','M.Ed','M.P.Ed','Ph.D',
  ],
  exam: [
    'SSLC','Matriculation (10th)','CBSE (10th)','ICSE (10th)','State Board (10th)','NIOS (10th)',
    'HSC','Higher Secondary','CBSE (12th)','ISC (12th)','State Board (12th)','NIOS (12th)',
    'JEE Main','JEE Advanced','MHT-CET','TS EAMCET','AP EAMCET','KCET','UGET','SRMJEEE','VITEEE',
    'NEET','JIPMER','AIIMS','CAT','MAT','GMAT','CMAT','TANCET (MBA)','KMAT',
    'CLAT','GATE','CUET','TNPG','TANCET (ME/MTech)',
  ],
  monthYear: (() => {
    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    const list = [];
    for (let y = 2015; y <= 2030; y++) for (const m of months) list.push(`${m}-${y}`);
    return list;
  })(),
  hostel: [
    'Mens Hostel','Womens Hostel','Boys Hostel No.1','Boys Hostel No.2',
    'Girls Hostel No.1','Girls Hostel No.2','Research Scholars Hostel',
  ],
  bloodGroup: ['A+','A-','B+','B-','AB+','AB-','O+','O-','GOLDEN'],
  studentType: ['AIDED','SELF-FINANCE'],
  dayType: ['DAYSCHOLAR','HOSTELLER'],
  shift: ['MORNING','EVENING'],
};

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
    aadharNumber: '234567890123', tshirt: '40', track: '42', status: 'approved'
  },
  {
    rollNo: '22PH002', nameOfTheGame: 'BADMINTON', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Priya Sharma', fathersName: 'Ramesh Sharma', motherName: 'Sudha Sharma',
    dateOfBirth: '2003-07-22', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'II Year', nameOfThePresentClass: 'PHYSICS', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Physics',
    graduateCourse: '1', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '45, Gandhi Road, Thanjavur - 613001', phoneNumber: '9865432101',
    aadharNumber: '345678901234', tshirt: '36', track: '38', status: 'approved'
  },
  {
    rollNo: '21MA003', nameOfTheGame: 'FOOTBALL', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Rahul Verma', fathersName: 'Anil Verma', motherName: 'Sunita Verma',
    dateOfBirth: '2001-11-08', nameOfExam: 'HSC', dateAndYear: 'April 2019',
    presentClass: 'IV Year', nameOfThePresentClass: 'MATHEMATICS', durationOfCourse: '4 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Mathematics',
    graduateCourse: '3', pgCourse: 'NIL', previousCourse: 'State level participant 2022',
    address: '78, Nehru Street, Madurai - 625001', phoneNumber: '9754321098',
    aadharNumber: '456789012345', tshirt: '42', track: '44', status: 'approved'
  },
  {
    rollNo: '23CH004', nameOfTheGame: 'VOLLEYBALL', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Anitha Devi', fathersName: 'Muthu Devi', motherName: 'Latha Devi',
    dateOfBirth: '2003-01-30', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'CHEMISTRY', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Chemistry',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '23, Raja Street, Tiruchirappalli - 620002', phoneNumber: '9643210987',
    aadharNumber: '567890123456', tshirt: '34', track: '36', status: 'approved'
  },
  {
    rollNo: '22CO005', nameOfTheGame: 'BASKETBALL', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Vijay Rajan', fathersName: 'Selvam Rajan', motherName: 'Kamala Rajan',
    dateOfBirth: '2002-09-14', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'COMMERCE', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Com',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'College level champion 2022',
    address: '56, Market Road, Kumbakonam - 612001', phoneNumber: '9532109876',
    aadharNumber: '678901234567', tshirt: '44', track: '46', status: 'approved'
  },
  {
    rollNo: '22HI006', nameOfTheGame: 'TABLE TENNIS', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Deepa Nair', fathersName: 'Gopalan Nair', motherName: 'Saritha Nair',
    dateOfBirth: '2002-05-19', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'HISTORY', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A History',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'NIL',
    address: '89, Lake View, Trichy - 620020', phoneNumber: '9421098765',
    aadharNumber: '789012345678', tshirt: '36', track: '38', status: 'approved'
  },
  {
    rollNo: '21BI007', nameOfTheGame: 'ATHLETICS', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Suresh Babu', fathersName: 'Babu Raja', motherName: 'Geetha Babu',
    dateOfBirth: '2001-08-25', nameOfExam: 'HSC', dateAndYear: 'April 2019',
    presentClass: 'IV Year', nameOfThePresentClass: 'BIOLOGY', durationOfCourse: '4 Years',
    university: 'Bharathidasan University', presentCourse: 'B.Sc Biology',
    graduateCourse: '3', pgCourse: 'NIL', previousCourse: 'National level 100m 2022',
    address: '34, Temple Street, Thanjavur - 613002', phoneNumber: '9310987654',
    aadharNumber: '890123456789', tshirt: '40', track: '42', status: 'approved'
  },
  {
    rollNo: '23TA008', nameOfTheGame: 'CHESS', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Kavitha Murugan', fathersName: 'Murugan Vel', motherName: 'Ponni Murugan',
    dateOfBirth: '2003-12-03', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'TAMIL', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A Tamil',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'District champion 2021',
    address: '67, Palani Road, Dindigul - 624001', phoneNumber: '9209876543',
    aadharNumber: '901234567890', tshirt: '34', track: '36', status: 'approved'
  },
  {
    rollNo: '22EN009', nameOfTheGame: 'HOCKEY', gender: 'MALE', year: '2023-2024',
    nameOfTheSportsperson: 'Manoj Kumar', fathersName: 'Ramkumar S', motherName: 'Vimala Ramkumar',
    dateOfBirth: '2002-04-11', nameOfExam: 'HSC', dateAndYear: 'April 2020',
    presentClass: 'III Year', nameOfThePresentClass: 'ENGLISH', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'B.A English',
    graduateCourse: '2', pgCourse: 'NIL', previousCourse: 'Inter-university 2022',
    address: '11, Church Road, Salem - 636001', phoneNumber: '9098765432',
    aadharNumber: '012345678901', tshirt: '42', track: '44', status: 'approved'
  },
  {
    rollNo: '23MB010', nameOfTheGame: 'SWIMMING', gender: 'FEMALE', year: '2023-2024',
    nameOfTheSportsperson: 'Lakshmi Priya', fathersName: 'Venkatesh P', motherName: 'Revathi Venkatesh',
    dateOfBirth: '2003-06-17', nameOfExam: 'HSC', dateAndYear: 'April 2021',
    presentClass: 'I Year', nameOfThePresentClass: 'MANAGEMENT', durationOfCourse: '3 Years',
    university: 'Bharathidasan University', presentCourse: 'BBA',
    graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'State swimmer of the year 2021',
    address: '99, Beach Road, Chennai - 600001', phoneNumber: '8987654321',
    aadharNumber: '123456789012', tshirt: '34', track: '36', status: 'approved'
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

    // Seed shared combo-box option lists (only fields that don't already have one)
    const existingKeys = new Set((await OptionList.find({}, 'key').lean()).map((o) => o.key));
    const missing = Object.keys(DEFAULT_OPTION_LISTS).filter((k) => !existingKeys.has(k));
    if (missing.length) {
      await OptionList.insertMany(missing.map((key) => ({ key, values: DEFAULT_OPTION_LISTS[key] })));
      console.log(`🧩  Seeded ${missing.length} shared option list(s)`);
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
      else if (file.fieldname === 'marksheetPdf')    cb(null, './uploads/marksheet/');
      else if (file.fieldname === 'feesReceiptPdf')  cb(null, './uploads/feesreceipt/');
      else cb(null, './uploads/');
    },
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['aadhaarPdf','idCardPdf','marksheetPdf','feesReceiptPdf'].includes(file.fieldname)) {
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
  { name: 'marksheetPdf',   maxCount: 1 },
  { name: 'feesReceiptPdf', maxCount: 1 },
]);

// ─── DRAFT FILE UPLOAD ────────────────────────────────────────────────────────

const uploadDraftFields = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/drafts/'),
    filename:    (req, file, cb) =>
      cb(null, `${file.fieldname.replace('Pdf', '')}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ext === '.pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
  },
}).fields([
  { name: 'aadhaarPdf',     maxCount: 1 },
  { name: 'idCardPdf',      maxCount: 1 },
  { name: 'marksheetPdf',   maxCount: 1 },
  { name: 'feesReceiptPdf', maxCount: 1 },
]);

// POST /api/draft-files — save PDFs to drafts folder, return relative paths
app.post('/api/draft-files', authMiddleware, uploadDraftFields, (req, res) => {
  const result = {};
  if (req.files?.aadhaarPdf?.[0])     result.aadhaarPath     = `drafts/${req.files.aadhaarPdf[0].filename}`;
  if (req.files?.idCardPdf?.[0])      result.idCardPath      = `drafts/${req.files.idCardPdf[0].filename}`;
  if (req.files?.marksheetPdf?.[0])   result.marksheetPath   = `drafts/${req.files.marksheetPdf[0].filename}`;
  if (req.files?.feesReceiptPdf?.[0]) result.feesReceiptPath = `drafts/${req.files.feesReceiptPdf[0].filename}`;
  res.json(result);
});

// DELETE /api/draft-files — delete draft files by path array
app.delete('/api/draft-files', authMiddleware, (req, res) => {
  const { paths } = req.body || {};
  if (!Array.isArray(paths)) return res.status(400).json({ error: 'paths must be an array' });
  for (const p of paths) {
    if (!p || !String(p).startsWith('drafts/')) continue; // safety: only allow paths in drafts/
    const full = path.join(__dirname, 'uploads', p);
    try { if (fs.existsSync(full)) fs.unlinkSync(full); } catch { /* ignore */ }
  }
  res.json({ ok: true });
});

// Helper: resolve the final PDF path — either move a draft file or use an uploaded file
function resolveDraftFile(uploadedFile, draftPath, destFolder) {
  if (uploadedFile) return `${destFolder}/${uploadedFile.filename}`;
  if (draftPath && String(draftPath).startsWith('drafts/')) {
    const src = path.join(__dirname, 'uploads', draftPath);
    const fn  = path.basename(draftPath);
    const dst = path.join(__dirname, 'uploads', destFolder, fn);
    try {
      if (fs.existsSync(src)) { fs.renameSync(src, dst); return `${destFolder}/${fn}`; }
    } catch { /* ignore */ }
  }
  return null;
}

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
      { id: user._id, username: user.username, role: user.role, avatar: user.avatar || null },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user._id, username: user.username, role: user.role, avatar: user.avatar || null } });
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

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/avatars/'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype))
      return cb(new Error('Only JPG and PNG images are allowed'));
    cb(null, true);
  },
});

app.put('/api/auth/profile', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.username && req.body.username !== user.username) {
      const exists = await User.findOne({ username: req.body.username });
      if (exists) return res.status(400).json({ error: 'Username already taken' });
      user.username = req.body.username;
    }

    if (req.file) {
      // Remove old avatar file if present
      if (user.avatar) {
        const old = path.join(__dirname, 'uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, avatar: user.avatar },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user._id, username: user.username, role: user.role, avatar: user.avatar } });
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
    if (department) filter.presentCourse = department;
    if (year)       filter.year                 = year;
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students/meta', authMiddleware, async (req, res) => {
  try {
    const [departments, years, games] = await Promise.all([
      Student.distinct('presentCourse'),
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

// ─── SHARED OPTION MANAGEMENT ────────────────────────────────────────────────
// These option lists are the single source of truth for every combo box in the
// app (dashboard filters, add-student form, edit-student form). Renaming or
// deleting an option here updates the OptionList collection, so every page
// reflects the change as soon as it re-fetches GET /api/options.
const OPTION_FIELDS = {
  year: ['year'], game: ['nameOfTheGame'], dept: ['presentCourse'],
  university: ['university'], class: ['presentClass'],
  duration: ['durationOfCourse'], course: ['presentCourse'],
  exam: ['nameOfExam'], monthYear: ['dateAndYear', 'university', 'nameOfThePresentClass'],
  iut: ['graduateCourse', 'pgCourse'], hostel: ['hostelName'],
  bloodGroup: ['bloodGroup'], studentType: ['studentType'],
  dayType: ['dayType'], shift: ['shift'],
};

app.get('/api/options', authMiddleware, async (req, res) => {
  try {
    const lists = await OptionList.find().lean();
    const out = {};
    for (const key of Object.keys(DEFAULT_OPTION_LISTS)) out[key] = [];
    for (const l of lists) out[l.key] = l.values;
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/options/add', authMiddleware, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!OPTION_FIELDS[key] && !DEFAULT_OPTION_LISTS[key]) return res.status(400).json({ error: 'Invalid option key' });
    const trimmed = (value || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Value required' });
    const doc = await OptionList.findOneAndUpdate(
      { key }, { $addToSet: { values: trimmed } }, { upsert: true, new: true }
    );
    res.json({ message: 'Option added', values: doc.values });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/options/rename', authMiddleware, async (req, res) => {
  try {
    const { key, oldValue, newValue } = req.body;
    const fields = OPTION_FIELDS[key];
    if (!fields || !oldValue || !newValue) return res.status(400).json({ error: 'Invalid option change' });
    const result = await Promise.all(fields.map((field) =>
      Student.updateMany({ [field]: oldValue }, { $set: { [field]: newValue } })
    ));
    // Keep the shared option list (used by every page's combo box) in sync.
    const renamed = await OptionList.updateOne({ key, values: oldValue }, { $set: { 'values.$': newValue } });
    if (!renamed.matchedCount) await OptionList.updateOne({ key }, { $addToSet: { values: newValue } }, { upsert: true });
    else await OptionList.updateOne({ key }, { $addToSet: { values: newValue } });
    res.json({ message: 'Option updated across student records', updated: result.reduce((n, r) => n + r.modifiedCount, 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/options/delete', authMiddleware, async (req, res) => {
  try {
    const { key, value, confirmed } = req.body;
    const fields = OPTION_FIELDS[key];
    if (!fields || !value) return res.status(400).json({ error: 'Invalid option deletion' });
    const query = { $or: fields.map((field) => ({ [field]: value })) };
    const used = await Student.countDocuments(query);
    // Always require an explicit second confirmation. This keeps deletion
    // inside the option panel even when no existing student uses the value.
    if (!confirmed) return res.json({ used, requiresConfirmation: true });
    const result = await Promise.all(fields.map((field) =>
      Student.updateMany({ [field]: value }, { $set: { [field]: 'Unknown' } })
    ));
    // Remove from the shared option list so it disappears from every page.
    await OptionList.updateOne({ key }, { $pull: { values: value } });
    res.json({ message: 'Option deleted and matching student fields set to Unknown', used, updated: result.reduce((n, r) => n + r.modifiedCount, 0) });
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
    const marksheetFile    = req.files?.marksheetPdf?.[0];
    const feesReceiptFile  = req.files?.feesReceiptPdf?.[0];
    if (idCardFile) {
      if (idCardFile.size < 100 * 1024)       return res.status(400).json({ error: 'ID card PDF too small (min 100 KB)' });
      if (idCardFile.size > 1 * 1024 * 1024)  return res.status(400).json({ error: 'ID card PDF too large (max 1 MB)' });
    }
    if (marksheetFile) {
      if (marksheetFile.size < 100 * 1024)      return res.status(400).json({ error: 'Marksheet PDF too small (min 100 KB)' });
      if (marksheetFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'Marksheet PDF too large (max 1 MB)' });
    }
    if (feesReceiptFile) {
      if (feesReceiptFile.size < 100 * 1024)      return res.status(400).json({ error: 'Fees receipt PDF too small (min 100 KB)' });
      if (feesReceiptFile.size > 1 * 1024 * 1024) return res.status(400).json({ error: 'Fees receipt PDF too large (max 1 MB)' });
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
      aadhaarPdf:     resolveDraftFile(aadhaarFile,     d.aadhaarDraftPath,     'aadhaar'),
      idCardPdf:      resolveDraftFile(idCardFile,      d.idCardDraftPath,      'idcard'),
      marksheetPdf:   resolveDraftFile(marksheetFile,   d.marksheetDraftPath,   'marksheet'),
      feesReceiptPdf: resolveDraftFile(feesReceiptFile, d.feesReceiptDraftPath, 'feesreceipt'),
      gender: d.gender, year: d.year, aadharNumber: d.aadharNumber,
      bloodGroup: d.bloodGroup,
      shift: d.shift,
      studentType: d.studentType, dayType: d.dayType, hostelName: d.hostelName,
      tshirt: d.tshirt, track: d.track,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      documentsVerified: d.documentsVerified === 'true',
    });
    const msg = student.status === 'approved' ? 'Student created successfully' : 'Student submitted for approval';
    res.json({ message: msg, savedTime, id: student._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/students/:id', authMiddleware, uploadFields, async (req, res) => {
  try {
    const d = req.body;
    const imageFile        = req.files?.image?.[0];
    const aadhaarFile      = req.files?.aadhaarPdf?.[0];
    const idCardFile       = req.files?.idCardPdf?.[0];
    const marksheetFile    = req.files?.marksheetPdf?.[0];
    const feesReceiptFile  = req.files?.feesReceiptPdf?.[0];
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
    // Remove old fees receipt PDF if replaced
    if (feesReceiptFile && student.feesReceiptPdf) {
      const old = path.join(__dirname, 'uploads', student.feesReceiptPdf);
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
      marksheetPdf:   marksheetFile   ? `marksheet/${marksheetFile.filename}`          : student.marksheetPdf,
      feesReceiptPdf: feesReceiptFile ? `feesreceipt/${feesReceiptFile.filename}`      : student.feesReceiptPdf,
      gender: d.gender, year: d.year, aadharNumber: d.aadharNumber,
      bloodGroup: d.bloodGroup,
      shift: d.shift,
      studentType: d.studentType, dayType: d.dayType, hostelName: d.hostelName,
      tshirt: d.tshirt, track: d.track,
      documentsVerified: d.documentsVerified === 'true',
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

app.delete('/api/students/:id/feesreceipt', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.feesReceiptPdf) {
      const filePath = path.join(__dirname, 'uploads', student.feesReceiptPdf);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      student.feesReceiptPdf = null;
      await student.save();
    }
    res.json({ message: 'Fees receipt PDF deleted' });
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

function deleteStudentFiles(student) {
  const files = [
    student.image,
    student.aadhaarPdf,
    student.idCardPdf,
    student.marksheetPdf,
    student.feesReceiptPdf,
  ];
  for (const f of files) {
    if (!f) continue;
    try {
      const fp = path.join(__dirname, 'uploads', f);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch { /* ignore */ }
  }
}

app.delete('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    deleteStudentFiles(student);
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
      deleteStudentFiles(s);
      await s.deleteOne();
    }
    res.json({ message: `${students.length} student(s) deleted` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── VERIFY DOCUMENTS ────────────────────────────────────────────────────────
app.patch('/api/students/:id/verify', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.documentsVerified = !!req.body.verified;
    await student.save();
    res.json({ documentsVerified: student.documentsVerified });
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
    if (student) {
      deleteStudentFiles(student);
      await student.deleteOne();
    }
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

// ─── SELF-REGISTRATION (PUBLIC) ───────────────────────────────────────────────

// Public option lists (no auth)
app.get('/api/self-reg/options', async (req, res) => {
  try {
    const lists = await OptionList.find().lean();
    const result = {};
    lists.forEach(l => { result[l.key] = l.values; });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Verify access (no auth)
app.post('/api/self-reg/verify', async (req, res) => {
  try {
    const { rollNo, nameOfGame, year } = req.body;
    if (!rollNo || !nameOfGame || !year)
      return res.status(400).json({ error: 'Roll number, game and year are required' });
    const access = await SelfRegAccess.findOne({ rollNo, nameOfGame, year });
    if (!access)
      return res.status(403).json({ error: 'Access not granted for this combination. Contact your admin.' });
    const existing = await Student.findOne({ rollNo, nameOfTheGame: nameOfGame, year });
    if (existing)
      return res.status(409).json({ error: 'You have already submitted a registration for this game and year.' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Self-register submit (no auth) — creates student as 'pending'
app.post('/api/self-reg/submit', uploadFields, async (req, res) => {
  try {
    const d = req.body;
    const access = await SelfRegAccess.findOne({ rollNo: d.rollNo, nameOfGame: d.nameOfTheGame, year: d.year });
    if (!access) return res.status(403).json({ error: 'Access not granted' });
    const existing = await Student.findOne({ rollNo: d.rollNo, nameOfTheGame: d.nameOfTheGame, year: d.year });
    if (existing) return res.status(409).json({ error: 'Already registered for this game and year' });

    const imageFile       = req.files?.image?.[0];
    const aadhaarFile     = req.files?.aadhaarPdf?.[0];
    const marksheetFile   = req.files?.marksheetPdf?.[0];
    const feesReceiptFile = req.files?.feesReceiptPdf?.[0];

    if (!imageFile)       return res.status(400).json({ error: 'Passport photo is required' });
    if (!aadhaarFile)     return res.status(400).json({ error: 'Aadhaar card PDF is required' });
    if (!marksheetFile)   return res.status(400).json({ error: '+2 Marksheet PDF is required' });
    if (!feesReceiptFile) return res.status(400).json({ error: 'Fees receipt PDF is required' });

    const savedTime = new Date().toISOString().replace(/[:.]/g, '-');
    await Student.create({
      savedTime,
      rollNo: d.rollNo, nameOfTheGame: d.nameOfTheGame,
      nameOfTheSportsperson: d.studentName, fathersName: d.fatherName,
      motherName: d.motherName, dateOfBirth: d.dob, nameOfExam: d.nameOfExam,
      dateAndYear: d.dateAndYear, presentClass: d.presentClass,
      nameOfThePresentClass: d.nameOfThePresentClass, durationOfCourse: d.durationOfCourse,
      university: d.university, presentCourse: d.presentCourse,
      graduateCourse: d.graduateCourse || 'NIL', pgCourse: d.pgCourse || 'NIL',
      previousCourse: d.previousCourse || 'NIL',
      address: d.address, phoneNumber: d.phoneNumber,
      image:          imageFile.filename,
      aadhaarPdf:     `aadhaar/${aadhaarFile.filename}`,
      marksheetPdf:   `marksheet/${marksheetFile.filename}`,
      feesReceiptPdf: `feesreceipt/${feesReceiptFile.filename}`,
      gender: d.gender, year: d.year, aadharNumber: d.aadharNumber,
      bloodGroup: d.bloodGroup,
      shift: d.shift,
      studentType: d.studentType, dayType: d.dayType, hostelName: d.hostelName || '',
      tshirt: d.tshirt || '', track: d.track || '',
      status: 'pending',
    });
    res.json({ success: true, message: 'Registration submitted successfully. Awaiting admin approval.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: SELF-REG ACCESS MANAGEMENT ───────────────────────────────────────

app.get('/api/admin/self-reg-access', authMiddleware, adminOnly, async (req, res) => {
  try {
    const list = await SelfRegAccess.find().sort('-createdAt').lean();
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/self-reg-access', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rollNo, nameOfGame, year } = req.body;
    if (!rollNo || !nameOfGame || !year)
      return res.status(400).json({ error: 'Roll number, game and year are required' });
    const exists = await SelfRegAccess.findOne({ rollNo, nameOfGame, year });
    if (exists) return res.status(409).json({ error: 'Access already granted for this combination' });
    const entry = await SelfRegAccess.create({ rollNo, nameOfGame, year, createdBy: req.user.username });
    res.json(entry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/self-reg-access/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await SelfRegAccess.findByIdAndDelete(req.params.id);
    res.json({ success: true });
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
