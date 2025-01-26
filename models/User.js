
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: false },
  fullName: String,
  photo: String,
  is_active: Boolean,
  role: { type: String, require: true },
  confirmationCode: String,
  resetPasswordToken: String,
  resetPasswordExpires: String,
  joined_at: Date,
  updated_at: Date,
  refreshToken: String, 
});

UserSchema.pre('save', function (next) {
  let user = this;
  if (this.isModified('password' || this.isNew)) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, null, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});


UserSchema.methods.comparePassword = function (password) {
  let user = this;
  return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('User', UserSchema);
