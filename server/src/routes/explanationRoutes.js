import express from "express";
import { generateStructuredExplanation } from "../controllers/explanationController.js";

const router = express.Router();

router.post("/generate-explanation", generateStructuredExplanation);

export default router;
