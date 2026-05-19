import { Router } from "express";
import { authenticate } from '../middleware/auth.js';
import { pageRequest } from "../controllers/proctect.pages.js";

const router = Router();

router.post("/page_request",authenticate, pageRequest);

export default router;