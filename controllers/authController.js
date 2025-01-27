const passport = require('passport');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const {
    singUpConfirmationEmailTemplate,
    forgotPasswordEmailTemplate,
    resetPasswordConfirmationEmailTemplate
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

exports.forgetPassword = async (req,res)=>{
    const user = await User.findOne({email : req.body.email});
    try {
    if(!user){
        return res.status(404).json({message: "utilisateur introuvable"});
    }
    else {
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token
        user.resetPasswordExpires= Date.now() + 3600000; 
        await user.save();

        const template = forgotPasswordEmailTemplate(
            user.fullName,
            user.email,
            API_ENDPOINT,
            token,
        );

        const data = {
            from : FROM_EMAIL ,
            to : user.email,
            subject : 'Réinitialisation de votre mot de passe',
            html : template
        }

        await sendEmail(data);

        return res.json({message:"Veuillez vérifier votre e-mail pour plus d'instructions"});
    }
} catch (error) {
    return res
      .status(500)
      .json({ message: 'Une erreur est survenue.', error: error.message });
  }
}

exports.restPassword = async (req, res) => {
    try {
      // Find user by reset password token and check expiration
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      // If user not found or token expired, return error
      if (!user) {
        return res.status(400).json({
          message:
            'Le jeton de réinitialisation de mot de passe est invalide ou a expiré.',
        });
      }
  
      // Check if new password matches verification password
      if (req.body.newPassword !== req.body.verifyPassword) {
        return res
          .status(422)
          .json({ message: 'Le mot de passe ne correspondent pas.' });
      }
  
      // Update user's password and clear reset token fields
      user.password = req.body.newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      // Send password reset confirmation email
      const template = resetPasswordConfirmationEmailTemplate(user.fullName);
      const data = {
        to: user.email,
        from: FROM_EMAIL,
        subject: 'Confirmation de réinitialisation du mot de passe',
        html: template,
      };
  
      await sendEmail(data);
  
      return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Une erreur est survenue.', error: error.message });
    }
  };
  



