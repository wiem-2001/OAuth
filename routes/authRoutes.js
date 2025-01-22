const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.get("/", (req, res) => {
    res.send("<a href='/auth/google'>Login With Google</a>"); // Lien pour se connecter avec Google
});
router.get("/auth/google", authController.loginWithGoogle);
router.get("/auth/google/callback", authController.googleCallback);
router.get("/profile", authController.getProfile);
router.get("/logout", authController.logout);

module.exports = router;
