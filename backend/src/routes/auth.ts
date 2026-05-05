import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

const validateUserData = [
  body("name").isString().isLength({ min: 20, max: 60 }).withMessage("Name must be 20-60 characters"),
  body("email").isEmail().withMessage("Must be a valid email"),
  body("address").isString().isLength({ max: 400 }).withMessage("Address must be at most 400 characters"),
  body("password").isLength({ min: 8, max: 16 }).matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter").matches(/[^A-Za-z0-9]/).withMessage("Password must contain at least one special character"),
];

function handleValidation(req: any, res: any, next: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.post("/signup", validateUserData, handleValidation, async (req, res) => {
  const { name, email, address, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { name, email, address, password: hashedPassword, role: Role.USER },
      select: { id: true, name: true, email: true, address: true, role: true },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

router.post("/login", [body("email").isEmail(), body("password").isString()], handleValidation, async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get("/me", authenticateToken, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, address: true, role: true },
  });
  res.json(user);
});

router.put("/password", authenticateToken, [body("password").isLength({ min: 8, max: 16 }).matches(/[A-Z]/).withMessage("Password must contain one uppercase").matches(/[^A-Za-z0-9]/).withMessage("Password must contain one special character")], handleValidation, async (req: any, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });
  res.json({ message: "Password updated" });
});

export default router;
