import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { materialRouter } from "./modules/materials/material.routes";
import { departmentRouter } from "./modules/departments/department.routes";
import { workSectionRouter } from "./modules/work-sections/workSection.routes";
import { positionRouter } from "./modules/positions/position.routes";
import { userRouter } from "./modules/users/user.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import { subjectRouter } from "./modules/subjects/subject.routes";
import { requisitionRouter } from "./modules/requisitions/requisition.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/materials", materialRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/work-sections", workSectionRouter);
app.use("/api/positions", positionRouter);
app.use("/api/users", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/requisitions", requisitionRouter);

app.use(notFoundHandler);
app.use(errorHandler);
