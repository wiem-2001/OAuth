const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

const verifyToken = async (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];

  if (token) {
    let checkBearer = 'Bearer ';
    if (token.startsWith(checkBearer)) {
      token = token.slice(checkBearer.length, token.length);
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.decoded = decoded; 
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
       
        if (!refreshToken) {
          return res.status(403).json({
            success: false,
            message: 'Access token expired, and no refresh token provided',
          });
        }
        try {
          const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
          const now = Math.floor(Date.now() / 1000);
          if (decodedRefresh.exp < now) {
            return res.status(403).json({
              success: false,
              message: 'Refresh token expired',
            });
          }
          const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
          const user = await User.findById(decodedRefresh.userId);
          if (!user || user.refreshToken !== hashedRefreshToken) {
            return res.status(403).json({
              success: false,
              message: 'Invalid refresh token',
            });
          }
          const newAccessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '5m',
          });
          res.set('x-new-access-token', newAccessToken);

          req.decoded = decodedRefresh;
          next();
        } catch (refreshErr) {
          return res.status(403).json({
            success: false,
            message: 'Invalid or expired refresh token',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Invalid access token',
        });
      }
    }
  } else {
    res.status(403).json({
      success: false,
      message: 'No token provided',
    });
  }
};

module.exports = verifyToken;