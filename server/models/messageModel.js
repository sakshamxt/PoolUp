import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    poolId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Pool',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;