require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Stratégie OAuth pour Google

const authRoutes = require('./routes/authRoutes'); // Importer les routes d'authentification

const app = express();

// Connexion à MongoDB
//mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Configurer les sessions
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
}));
// Configurer la stratégie Google pour Passport
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID, // ID client Google
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Secret client Google
        callbackURL: "http://localhost:3000/auth/google/callback", // URL de redirection après l'authentification
    },
    (accessToken, refreshToken, profile, done) => {
        // Callback après l'authentification réussie
        return done(null, profile); // Passer le profil de l'utilisateur à Passport
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Utiliser les routes d'authentification
app.use('/', authRoutes);

// Démarrer le serveur
app.listen(3000, () => {
    console.log(`Server is running at port 3000`);
});
