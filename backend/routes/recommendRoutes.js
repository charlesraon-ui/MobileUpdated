// routes/recommendRoutes.js
import { Router } from "express";
import { recommendForProduct, recommendForUser } from "../controllers/recommendController.js";

const router = Router();

router.get("/", recommendForUser);                    // /api/recommendations?userId=&cart=&limit=
router.get("/product/:id", recommendForProduct);      // /api/recommendations/product/:id?limit=

export default router;
