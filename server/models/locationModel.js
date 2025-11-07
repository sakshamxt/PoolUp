import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['campus', 'hub'],
    required: true,
  },
});

const Location = mongoose.model('Location', locationSchema);

export default Location;