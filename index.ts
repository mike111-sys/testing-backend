import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}



// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save to uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Test route
app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

// Upload route
app.post('/api/products/upload', upload.single('image'), (req: Request, res: Response): void => {
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
  const metadataPath = path.join(uploadsDir, `${req.file.filename}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));

  res.status(200).json(metadata);
});

  

  //added
  app.get('/api/uploads', (req: Request, res: Response) => {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Could not read uploads folder' });
      }
  
      const images = files
        .filter(file => !file.endsWith('.json'))
        .map(file => {
          const jsonPath = path.join(uploadsDir, `${file}.json`);
          let name = 'Unknown';
  
          if (fs.existsSync(jsonPath)) {
            const metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
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
  app.delete('/api/uploads/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
  
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(404).json({ error: 'File not found or already deleted' });
      }
  
      res.status(200).json({ message: 'File deleted successfully' });
    });
  });
  


// MySQL test connection


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
