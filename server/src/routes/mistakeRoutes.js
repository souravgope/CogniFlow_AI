import express from "express";
import { analyzeMistake } from "../controllers/mistakeController.js";

const router = express.Router();

router.post("/analyze-mistake", analyzeMistake);

export default router;
