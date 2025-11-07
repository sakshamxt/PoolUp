import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ratingSchema = new mongoose.Schema({
  byUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  rating: {
    type: String,
    enum: ['show', 'no-show'],
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required.'],
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    reliabilityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    ratings: [ratingSchema],
    fcmToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();

  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

export default User;