require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Stratégie OAuth pour Google

const authRoutes = require('./routes/authRoutes'); // Importer les routes d'authentification

const app = express();

// Middleware pour parser le JSON
app.use(express.json()); // Ajout du middleware pour traiter le JSON

/// DATABASE CONNECTION
mongoose.connect(
  process.env.NODE_ENV === 'production'
    ? process.env.PROD_DATABASE
    : process.env.DEV_DATABASE
)
.then(() => {
  console.log('Connected to the database');
})
.catch((err) => {
  console.error('Database connection error:', err);
});

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

// PORT
const PORT = process.env.PORT || 3000;
// Démarrer le serveur
app.listen(PORT, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Listening on PORT ${PORT}`);
    }
});
