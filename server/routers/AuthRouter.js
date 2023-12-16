import { Router } from "express";
import authController from "../controllers/authController.js";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = new Router()

router.post('/reg',
    body('password').isLength({min: 6, max: 32}),
    authController.reg)
router.post('/login',
    body('password').isLength({min: 6, max: 32}),
    authController.login)
router.get('/logout', authController.logout)
router.get('/refresh', authController.refresh)
router.get('/checkAuth', authMiddleware('user'), authController.checkAuth)

export default router