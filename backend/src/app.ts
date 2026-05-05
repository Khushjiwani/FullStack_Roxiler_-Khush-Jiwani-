import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth";
import storeRoutes from "./routes/stores";
import userRoutes from "./routes/users";
import ratingRoutes from "./routes/ratings";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Fullstack Intern Coding Challenge API" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/stores", storeRoutes);
app.use("/ratings", ratingRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

export default app;
