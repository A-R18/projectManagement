import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
import healthCheck from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.route.js";

app.use("/app/v1/healthcheck", healthCheck);
app.use("/app/v1/auth", authRouter);
app.get("/", (req, res) => res.status(201).json({ message: "it works" }));

export default app;
