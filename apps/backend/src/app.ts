import cors from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";

import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { authRouter } from "./routes/authRoutes.js";
import { dealsRouter } from "./routes/dealsRoutes.js";
import { categoriesRouter } from "./routes/categoriesRoutes.js";
import { businessDealsRouter } from "./routes/businessDealsRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use((req, res, next) => {
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    (req as any).requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });

  app.use(
    pinoHttp({
      genReqId: (req: any) => (req as any).requestId,
      customProps: (req: any) => ({ requestId: (req as any).requestId }),
    })
  );

  app.use(helmet());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? [],
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.use(express.json({ limit: "1mb" }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/categories", categoriesRouter);
  app.use("/deals", dealsRouter);
  app.use("/business/deals", businessDealsRouter);
  app.use("/admin", adminRouter);

  app.use(errorMiddleware);

  return app;
}
