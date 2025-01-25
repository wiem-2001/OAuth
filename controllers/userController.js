const express = require('express');
const User=require('../models/User');
const getCurrentUser = async (req, res) => {
    try {
      const user = await User.findById(req.decoded.userId).select('-password');
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };
  const logout = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'No refresh token provided',
        });
      }
      const user = await User.findById(req.decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      user.refreshToken = null;
      await user.save();
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };
  

module.exports = {
    getCurrentUser,
    logout

};
