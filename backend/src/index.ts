import cors from 'cors';
import express from 'express';
import { DataStore } from './dataStore.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createChatRouter } from './routes/chat.js';
import { createCompaniesRouter } from './routes/companies.js';
import { createHealthRouter } from './routes/health.js';
import { createToolsRouter } from './routes/tools.js';
import { config } from './config.js';

const store = DataStore.load();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));

app.use('/api', createHealthRouter(store));
app.use('/api/companies', createCompaniesRouter(store));
app.use('/api/chat', createChatRouter(store));
app.use('/api/tools', createToolsRouter(store));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Three-Body API on http://localhost:${config.port}`);
  console.log(`Dataset: ${store.manifest.companyCount} companies · Gemini: ${config.geminiApiKey ? 'configured' : 'MISSING — add GEMINI_API_KEY to backend/.env'}`);
});
