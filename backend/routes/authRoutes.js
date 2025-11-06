import { Router } from "express";
import { login, register, googleAuth, initiateRegistration, confirmRegistration, verifyRegistrationOtp, forgotPassword, resetPassword, resetPasswordRedirect } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/register/initiate", initiateRegistration);
router.get("/register/confirm", confirmRegistration);
router.post("/register/otp/verify", verifyRegistrationOtp);
router.post("/login", login);
router.post("/google", googleAuth);
// Forgot password
router.post("/password/forgot", forgotPassword);
router.get("/password/reset", resetPasswordRedirect);
router.post("/password/reset", resetPassword);

export default router;
