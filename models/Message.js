const mongoose = require("mongoose")

const MessageSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  recipient: {
    type: String,
    default: null,
  },
})

module.exports = mongoose.model("Message", MessageSchema)
