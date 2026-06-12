import { Router } from "express";
import multer from "multer";
import { generateDocs } from "../controllers/docsController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 20
  }
});

function handleUpload(req, res, next) {
  upload.array("files", 20)(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "One uploaded file is too large. Please upload files up to 25 MB each."
          : error.message;

      return res.status(413).json({ message });
    }

    return next(error);
  });
}

router.post("/generate-docs", handleUpload, generateDocs);

export default router;
