"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000');
// Ensure uploads folder exists
const uploadsDir = path_1.default.join(__dirname, './uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir);
}
// Multer storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Save to uploads folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded images statically
app.use('/uploads', express_1.default.static(uploadsDir));
// Test route
app.get('/', (req, res) => {
    res.send('API is running');
});
// Upload route
app.post('/api/products/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: 'No name provided' });
        return;
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const metadata = {
        name,
        filename: req.file.filename,
        imageUrl,
    };
    // Optional: save metadata to a JSON file or database
    const metadataPath = path_1.default.join(uploadsDir, `${req.file.filename}.json`);
    fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata));
    res.status(200).json(metadata);
});
//added
app.get('/api/uploads', (req, res) => {
    fs_1.default.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Could not read uploads folder' });
        }
        const images = files
            .filter(file => !file.endsWith('.json'))
            .map(file => {
            const jsonPath = path_1.default.join(uploadsDir, `${file}.json`);
            let name = 'Unknown';
            if (fs_1.default.existsSync(jsonPath)) {
                const metadata = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf-8'));
                name = metadata.name;
            }
            return {
                name,
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file}`,
            };
        });
        res.json({ images });
    });
});
// Express backend route for deleting products
app.delete('/api/uploads/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(uploadsDir, filename);
    fs_1.default.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(404).json({ error: 'File not found or already deleted' });
        }
        res.status(200).json({ message: 'File deleted successfully' });
    });
});
// MySQL test connection
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
