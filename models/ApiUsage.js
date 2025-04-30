const mongoose = require("mongoose")

const ApiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  apiKey: {
    type: String,
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  responseTime: {
    type: Number,
    default: 0,
  },
  success: {
    type: Boolean,
    default: true,
  },
})

module.exports = mongoose.model("ApiUsage", ApiUsageSchema)
