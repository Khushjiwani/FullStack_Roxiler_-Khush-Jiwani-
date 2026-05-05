import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const storeValidation = [
  body("name").isString().isLength({ min: 3 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid store email is required"),
  body("address").isString().isLength({ max: 400 }).withMessage("Address must be at most 400 characters"),
];

function handleValidation(req: any, res: any, next: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.post("/", authenticateToken, authorizeRoles(Role.ADMIN), storeValidation, handleValidation, async (req, res) => {
  const { name, email, address } = req.body;
  try {
    const store = await prisma.store.create({ data: { name, email, address } });
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: "Store email already exists" });
  }
});

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  const where: any = {};
  const name = req.query.name?.toString();
  const address = req.query.address?.toString();
  if (name) where.name = { contains: name, mode: "insensitive" };
  if (address) where.address = { contains: address, mode: "insensitive" };

  const stores = await prisma.store.findMany({
    where,
    include: { ratings: true },
    orderBy: { name: "asc" },
  });

  const results = stores.map((store) => ({
    id: store.id,
    name: store.name,
    email: store.email,
    address: store.address,
    overallRating:
      store.ratings.length > 0 ? Number((store.ratings.reduce((sum, r) => sum + r.score, 0) / store.ratings.length).toFixed(2)) : 0,
  }));

  res.json(results);
});

router.get("/admin/dashboard", authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalStores = await prisma.store.count();
  const totalRatings = await prisma.rating.count();
  res.json({ totalUsers, totalStores, totalRatings });
});

router.get("/owner", authenticateToken, authorizeRoles(Role.OWNER), async (req: AuthRequest, res) => {
  const store = await prisma.store.findFirst({
    where: { ownerId: req.user.id },
    include: { ratings: { include: { user: true } } },
  });
  if (!store) return res.status(404).json({ error: "Store not found for this owner" });

  const averageRating = store.ratings.length
    ? Number((store.ratings.reduce((sum, r) => sum + r.score, 0) / store.ratings.length).toFixed(2))
    : 0;

  const submissions = store.ratings.map((rating) => ({
    id: rating.id,
    score: rating.score,
    user: { id: rating.user.id, name: rating.user.name, email: rating.user.email },
    updatedAt: rating.updatedAt,
  }));

  res.json({ store: { id: store.id, name: store.name, address: store.address, averageRating }, submissions });
});

export default router;
