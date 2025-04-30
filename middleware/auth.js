const User = require("../models/User") // Assuming User model is in models/User.js

module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect("/auth/login")
  },

  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next()
    }
    res.status(403).render("error", {
      title: "Access Denied",
      message: "You do not have permission to access this resource",
    })
  },

  ensurePremium: (req, res, next) => {
    if (req.isAuthenticated() && (req.user.isPremium || req.user.role === "admin")) {
      return next()
    }
    res.redirect("/upgrade")
  },

  validateApiKey: async (req, res, next) => {
    const apiKey = req.headers["x-api-key"]
    const apiSecret = req.headers["x-api-secret"]

    if (!apiKey || !apiSecret) {
      return res.status(401).json({ error: "API key and secret are required" })
    }

    try {
      const user = await User.findOne({ apiKey, apiSecret })

      if (!user) {
        return res.status(401).json({ error: "Invalid API credentials" })
      }

      req.apiUser = user
      next()
    } catch (err) {
      res.status(500).json({ error: "Server error" })
    }
  },
}
