const passport = require('passport');
const User = require('../models/User');

exports.loginWithGoogle = passport.authenticate('google', { scope: ["profile", "email"] });

exports.googleCallback = (req, res) => {
    res.redirect('/profile');
};

exports.getProfile = (req, res) => {
    res.send(`Welcome ${req.user.displayName}`);
};

// Fonction pour sérialiser l'utilisateur dans la session
passport.serializeUser((user, done) => done(null, user));

// Fonction pour désérialiser l'utilisateur à partir de la session
passport.deserializeUser((user, done) => done(null, user));

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
};
