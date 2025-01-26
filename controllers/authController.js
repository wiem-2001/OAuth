const passport = require('passport');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const {
    singUpConfirmationEmailTemplate,
} = require('../template/userAccountEmailTemplates');
const { sendEmail, FROM_EMAIL, API_ENDPOINT } = require('../utils/helpers');

exports.loginWithGoogle = passport.authenticate('google', { scope: ["profile", "email"] });

exports.googleCallback = async (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
      if (err) {
          return res.status(500).json({
              success: false,
              message: "Une erreur est survenue lors de l'authentification",
              error: err.message,
          });
      }

      if (!user) {
          return res.status(401).json({
              success: false,
              message: "User not authenticated",
          });
      }

      try {
          const accessToken = jwt.sign(
              { userId: user._id }, 
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
          );

          // Generate refresh token
          const refreshToken = jwt.sign(
              { userId: user._id }, 
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
          );
          const hashedRefreshToken = crypto
              .createHash('sha256')
              .update(refreshToken)
              .digest('hex');

          user.refreshToken = hashedRefreshToken;
          await user.save();
          res.cookie('refreshToken', refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict', // Prevent CSRF attacks
              maxAge: 7 * 24 * 60 * 60 * 1000, 
          });
          return res.json({
              success: true,
              accessToken,
              user: {
                  email: user.email,
                  fullName: user.fullName,
              },
          });
      } catch (error) {
          return res.status(500).json({
              success: false,
              message: "Une erreur est survenue lors de l'authentification",
              error: error.message,
          });
      }
  })(req, res, next);
};

exports.getProfile = (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    res.send(`Welcome ${req.user.fullName}`);
};

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

exports.signUp = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: 'Veuillez saisir votre email ou votre mot de passe',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Un utilisateur avec cet e-mail existe déjà',
            });
        }

        const newUser = new User({
            email,
            password,
            confirmationCode: crypto.randomBytes(20).toString('hex'),
            fullName,
            is_active: false, 
            role: 'user', 
            joined_at: new Date(),
        });
        await newUser.save();
        const template = singUpConfirmationEmailTemplate(
            newUser.fullName,
            API_ENDPOINT,
            newUser.email,
            newUser.confirmationCode,
        );

        const data = {
            from: FROM_EMAIL,
            to: newUser.email,
            subject: 'Confirmation de votre enregistrement sur l’application',
            html: template,
        };
        await sendEmail(data);
        return res.json({
            message: "Veuillez vérifier votre e-mail pour plus d'instructions",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de l'enregistrement de l'utilisateur",
            error: error.message,
        });
    }
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ email });
    if (!foundUser || !foundUser.comparePassword(password)) {
      return res.status(403).json({
        success: false,
        message: "Échec de l'authentification, email ou mot de passe incorrect",
      });
    }
    if (!foundUser.is_active) {
      return res.status(405).json({
        success: false,
        message:
          "Votre compte n'est pas activé ! Merci de consulter votre email ou contacter l'équipe",
      });
    }
    const accessToken = jwt.sign({ userId: foundUser._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });

    const refreshToken = jwt.sign({ userId: foundUser._id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION
    });
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    foundUser.refreshToken = hashedRefreshToken;
    await foundUser.save();

    // Set the refresh token in an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict', 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });
    return res.json({
      success: true,
      accessToken,
      user: {
        email: foundUser.email,
        fullName: foundUser.fullName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'authentification",
      error: error.message,
    });
  }
};




