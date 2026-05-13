import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { processDocument, askQuestion } from './services/rag.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running correctly.' });
});

// Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const result = await processDocument(req.file.path, req.file.mimetype);
        res.status(200).json(result);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

// Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const answer = await askQuestion(question);
        res.status(200).json({ answer });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
