require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Import the User model

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();

app.use(express.json());

// Database Connection
mongoose.connect(
    process.env.NODE_ENV === 'production'
        ? process.env.PROD_DATABASE
        : process.env.DEV_DATABASE,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
)
.then(() => {
    console.log('Connected to the database');
})
.catch((err) => {
    console.error('Database connection error:', err);
});

// Session Configuration
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
}));

// Google Strategy
passport.use(
  new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
              // Create a new user if they don't exist
              user = new User({
                  email: profile.emails[0].value,
                  fullName: profile.displayName,
                  is_active: true,
                  role: 'user',
                  joined_at: new Date(),
              });
              await user.save(); // Save the user to get the _id
          }

          return done(null, user); // Pass the user object to the callback
      } catch (err) {
          return done(err, null);
      }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use('/user', userRoutes);
app.use('/', authRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Listening on PORT ${PORT}`);
    }
});