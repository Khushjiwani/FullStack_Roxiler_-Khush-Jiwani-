import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const userValidation = [
  body("name").isString().isLength({ min: 20, max: 60 }).withMessage("Name must be 20-60 characters"),
  body("email").isEmail().withMessage("Must be a valid email"),
  body("address").isString().isLength({ max: 400 }).withMessage("Address must be at most 400 characters"),
  body("password").isLength({ min: 8, max: 16 }).matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter").matches(/[^A-Za-z0-9]/).withMessage("Password must contain at least one special character"),
  body("role").isIn([Role.ADMIN, Role.USER, Role.OWNER]).withMessage("Role must be ADMIN, USER or OWNER"),
];

function handleValidation(req: any, res: any, next: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.get(
  "/",
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  [query("name").optional().isString(), query("email").optional().isEmail(), query("address").optional().isString(), query("role").optional().isString()],
  handleValidation,
  async (req, res) => {
    const filters: any = {};
    if (req.query.name) filters.name = { contains: String(req.query.name), mode: "insensitive" };
    if (req.query.email) filters.email = { contains: String(req.query.email), mode: "insensitive" };
    if (req.query.address) filters.address = { contains: String(req.query.address), mode: "insensitive" };
    if (req.query.role) filters.role = String(req.query.role).toUpperCase();

    const users = await prisma.user.findMany({
      where: filters,
      select: { id: true, name: true, email: true, address: true, role: true, storeId: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  }
);

router.post("/", authenticateToken, authorizeRoles(Role.ADMIN), userValidation, handleValidation, async (req, res) => {
  const { name, email, address, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, address, password: hashedPassword, role },
      select: { id: true, name: true, email: true, address: true, role: true },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

router.get("/:id", authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, address: true, role: true, store: { select: { id: true, name: true } } },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
