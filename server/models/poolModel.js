import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

const poolSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    origin: {
      type: String,
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      index: true,
    },
    departureTime: {
      type: Date,
      required: true,
      index: true,
    },
    maxSeats: {
      type: Number,
      required: true,
      min: 2,
      max: 10,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    genderPref: {
      type: String,
      enum: ['all', 'male', 'female'],
      required: true,
      default: 'all',
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    joinRequests: [joinRequestSchema],
  },
  {
    timestamps: true,
  }
);

const Pool = mongoose.model('Pool', poolSchema);

export default Pool;