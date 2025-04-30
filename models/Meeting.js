const mongoose = require("mongoose")

const MeetingSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    default: "Untitled Meeting",
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  participants: [
    {
      userId: String,
      name: String,
      email: String,
      joinedAt: Date,
      leftAt: Date,
    },
  ],
  recordings: [
    {
      url: String,
      startTime: Date,
      endTime: Date,
      size: Number,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
})

module.exports = mongoose.model("Meeting", MeetingSchema)
