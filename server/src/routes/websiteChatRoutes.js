import { Router } from "express";
import { askWebsiteChat } from "../controllers/websiteChatController.js";

const router = Router();

router.post("/website-chat", askWebsiteChat);

export default router;
