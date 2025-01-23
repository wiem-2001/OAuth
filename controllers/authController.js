const passport = require('passport');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Ensure crypto is imported
const {
    singUpConfirmationEmailTemplate,
} = require('../template/userAccountEmailTemplates');
const { sendEmail, FROM_EMAIL, API_ENDPOINT } = require('../utils/helpers');

exports.loginWithGoogle = passport.authenticate('google', { scope: ["profile", "email"] });

exports.googleCallback = (req, res) => {
    res.redirect('/profile');
};

exports.getProfile = (req, res) => {
    res.send(`Welcome ${req.user.displayName}`);
};

// Serialize user
passport.serializeUser((user, done) => done(null, user));

// Deserialize user
passport.deserializeUser((user, done) => done(null, user));

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
};

// Sign up function
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
            is_active: false, // Make sure to initialize is_active
            role: 'user', // Set a default role if needed
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

    // Find the user by email
    const foundUser = await User.findOne({ email });

    // If user not found or password doesn't match, return error
    if (!foundUser || !foundUser.comparePassword(password)) {
      return res.status(403).json({
        success: false,
        message: "Échec de l'authentification, email ou mot de passe incorrect",
      });
    }

    // Check if user account is active
    if (!foundUser.is_active) {
      return res.status(405).json({
        success: false,
        message:
          "Votre compte n'est pas activé ! Merci de consulter votre email ou contacter l'équipe",
      });
    }

    // Generate JWT token
    const token = jwt.sign(foundUser.toJSON(), process.env.SECRET, {
      expiresIn: '7d', // Token expires in 7 days
    });

    // Return success response with token and user information
    return res.json({
      success: true,
      token,
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
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
