import express from "express";
import routes from "./routes.js";
// Load necessary packages
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Use environment variable for frontend origin with a safe default for dev
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 204
    })
);

// Parse JSON bodies
app.use(express.json());
app.use('', routes);

export default app;