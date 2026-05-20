import { Router } from "express";
import { authenticate } from '../middleware/auth.js';
import { validation } from '../middleware/validation.js';
import { pageRequest } from "../controllers/proctect.pages.js";

const router = Router();

router.post("/page_request",authenticate,validation, pageRequest);

export default router;