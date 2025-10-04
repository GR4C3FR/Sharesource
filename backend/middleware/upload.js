const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, uploadDir);
},
filename: function (req, file, cb) {
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
const ext = path.extname(file.originalname);
cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
}
});


// fileFilter: allow pdf, docx, doc, txt, optionally others
function fileFilter(req, file, cb) {
const allowed = /pdf|docx|doc|txt/;
const ext = path.extname(file.originalname).toLowerCase();
if (allowed.test(ext)) {
cb(null, true);
} else {
cb(new Error('Only .pdf, .docx, .doc, .txt are allowed'));
}
}


const upload = multer({
storage,
limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
fileFilter
});


module.exports = upload;