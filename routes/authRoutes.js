const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get("/", (req, res) => {
    res.send("<a href='/auth/google'>Login With Google</a>"); // Link to login with Google
});
router.get("/auth/google", authController.loginWithGoogle);
router.get("/auth/google/callback", authController.googleCallback);
router.get("/profile", authController.getProfile);
router.post("/register", authController.signUp); 
router.post("/signIn", authController.signIn); 
router.post("/forgetPassword", authController.forgetPassword); 
router.post("/restPassword/:token", authController.restPassword); 

module.exports = router;
