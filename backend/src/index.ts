import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import { rateLimit } from './middleware/security';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
    'https://www.smartpharmacy.me',
    'https://smartpharmacy.me',
    'http://localhost:5173',
    /\.replit\.dev$/
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(allowed => 
            typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
        )) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(rateLimit);
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: true
}));

app.get('/', (_req, res) => {
    res.send('✅ Smart Pharmacy Backend is Running!');
});

app.use('/api', apiRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
