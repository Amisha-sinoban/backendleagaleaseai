const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only PDF and DOC files
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'), false);
    }
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://legaleaseai-genai.web.app',
    'https://legaleaseai-genai.firebaseapp.com'
  ],
  credentials: true
}));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'LegalEase AI Backend is running successfully!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET / - This health check',
      'GET /health - System health',
      'GET /documents - Documents API info',
      'GET /documents/list - List documents',
      'POST /documents/upload - Upload documents'
    ]
  });
});

// API health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Documents API info
app.get('/documents', (req, res) => {
  res.json({
    message: 'Documents API is working perfectly!',
    version: '1.0.0',
    endpoints: [
      'GET /documents - This endpoint',
      'POST /documents/upload - Upload documents',
      'GET /documents/list - List documents',
      'GET /documents/health - Service health'
    ],
    timestamp: new Date().toISOString()
  });
});

// Documents service health
app.get('/documents/health', (req, res) => {
  res.json({
    service: 'documents',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: ['upload', 'list', 'process']
  });
});

// List documents (demo data)
app.get('/documents/list', (req, res) => {
  const documents = [
    {
      id: 'doc-001',
      name: 'Sample Legal Document.pdf',
      uploadedAt: new Date().toISOString(),
      status: 'processed',
      type: 'legal',
      size: '2.3 MB'
    },
    {
      id: 'doc-002',
      name: 'Contract Agreement.pdf',
      uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'uploaded',
      type: 'contract',
      size: '1.8 MB'
    },
    {
      id: 'doc-003',
      name: 'Terms of Service.docx',
      uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'processing',
      type: 'terms',
      size: '950 KB'
    }
  ];
  
  res.json({
    success: true,
    documents: documents,
    count: documents.length,
    timestamp: new Date().toISOString()
  });
});

// Upload document endpoint with real file handling
app.post('/documents/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const uploadInfo = {
      success: true,
      message: 'File uploaded successfully!',
      data: {
        uploadId: 'upload-' + Date.now(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      },
      nextSteps: ['Text extraction', 'Legal analysis', 'Simplification']
    };
    
    res.json(uploadInfo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Document simplification endpoint
app.post('/documents/simplify', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'No file path provided',
        message: 'Please provide a valid file path'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    // Run Python script for text simplification
    const pythonScript = path.join(__dirname, 'scripts', 'simple_legal_simplifier.py');
    
    if (!fs.existsSync(pythonScript)) {
      return res.status(500).json({
        success: false,
        error: 'Processing script not found',
        message: 'Document processing is temporarily unavailable'
      });
    }

    // Execute Python script
    const pythonProcess = spawn('python', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Send file path to Python script
    pythonProcess.stdin.write(filePath);
    pythonProcess.stdin.end();

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        res.json({
          success: true,
          message: 'Document processed successfully!',
          output: output.trim(),
          processedAt: new Date().toISOString(),
          fileProcessed: path.basename(filePath)
        });
      } else {
        console.error('Python script error:', errorOutput);
        res.status(500).json({
          success: false,
          error: 'Processing failed',
          message: 'Unable to process the document. Please try again.',
          details: errorOutput || 'Unknown processing error'
        });
      }
    });

    // Handle script execution timeout
    setTimeout(() => {
      pythonProcess.kill();
      res.status(408).json({
        success: false,
        error: 'Processing timeout',
        message: 'Document processing took too long. Please try again.'
      });
    }, 30000); // 30 second timeout

  } catch (error) {
    console.error('Simplification error:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: 'An unexpected error occurred during processing'
    });
  }
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test successful!',
    timestamp: new Date().toISOString(),
    status: 'working'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message
    });
  }
  
  // Handle other errors
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/', '/health', '/documents', '/documents/list', '/documents/upload'],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LegalEase AI Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`✅ All endpoints ready and working!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});
