import { Router } from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const ratingValidation = [
  body("storeId").isInt({ gt: 0 }).withMessage("Store ID is required"),
  body("score").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
];

function handleValidation(req: any, res: any, next: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.post("/", authenticateToken, ratingValidation, handleValidation, async (req: AuthRequest, res) => {
  const { storeId, score } = req.body;

  try {
    const rating = await prisma.rating.upsert({
      where: { userId_storeId: { userId: req.user.id, storeId } },
      update: { score },
      create: { score, store: { connect: { id: storeId } }, user: { connect: { id: req.user.id } } },
    });
    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({ error: "Unable to submit rating" });
  }
});

router.get("/user", authenticateToken, async (req: AuthRequest, res) => {
  const ratings = await prisma.rating.findMany({ where: { userId: req.user.id }, include: { store: true } });
  res.json(ratings.map((rating) => ({
    storeId: rating.storeId,
    storeName: rating.store.name,
    score: rating.score,
    updatedAt: rating.updatedAt,
  })));
});

export default router;
