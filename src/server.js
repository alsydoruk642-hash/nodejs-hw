import userRouter from './routes/userRoutes.js';

import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import { logger } from './middleware/logger.js';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRouter from './routes/notesRoutes.js';
import authRouter from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(logger);

// Routers
app.use(authRouter);
app.use(notesRouter);
app.use(userRouter);
// Middleware
app.use(errors());

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await connectMongoDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();
