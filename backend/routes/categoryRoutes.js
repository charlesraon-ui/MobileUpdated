// routes/categoryRoutes.js
import { Router } from "express";
import {
  createCategory,
  listCategories,
} from "../controllers/categoryController.js";

const router = Router();

// list categories
router.get("/", listCategories);

// create category
router.post("/", createCategory);

export default router;
