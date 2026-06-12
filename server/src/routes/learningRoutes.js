import { Router } from "express";
import { generateLearning, generateQuiz } from "../controllers/learningController.js";

const router = Router();

router.post("/generate-learning-path", generateLearning);
router.post("/generate-quiz", generateQuiz);

export default router;
