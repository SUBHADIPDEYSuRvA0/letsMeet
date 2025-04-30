const express = require("express")
const router = express.Router()
const passport = require("passport")
const User = require("../models/User")
const { ensureAuthenticated } = require("../middleware/auth")

// Login page
router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/")
  }
  res.render("auth/login", { title: "Login" })
})

// Register page
router.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/")
  }
  res.render("auth/register", { title: "Register" })
})

// Register handle
router.post("/register", async (req, res) => {
  const { name, email, password, password2 } = req.body
  const errors = []

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" })
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" })
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" })
  }

  if (errors.length > 0) {
    res.render("auth/register", {
      title: "Register",
      errors,
      name,
      email,
    })
  } else {
    try {
      // Check if email exists
      const existingUser = await User.findOne({ email })

      if (existingUser) {
        errors.push({ msg: "Email is already registered" })
        return res.render("auth/register", {
          title: "Register",
          errors,
          name,
          email,
        })
      }

      // Create new user
      const newUser = new User({
        name,
        email,
        password,
      })

      await newUser.save()

      req.flash("success_msg", "You are now registered and can log in")
      res.redirect("/auth/login")
    } catch (err) {
      console.error(err)
      res.render("error", {
        title: "Server Error",
        message: "Something went wrong. Please try again later.",
      })
    }
  }
})

// Login handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next)
})

// Logout handle
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    req.flash("success_msg", "You are logged out")
    res.redirect("/auth/login")
  })
})

// Profile page
router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("auth/profile", {
    title: "Profile",
    user: req.user,
  })
})

// Update profile
router.post("/profile", ensureAuthenticated, async (req, res) => {
  const { name, email } = req.body

  try {
    const user = await User.findById(req.user.id)

    user.name = name
    user.email = email

    await user.save()

    req.flash("success_msg", "Profile updated successfully")
    res.redirect("/auth/profile")
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error updating profile")
    res.redirect("/auth/profile")
  }
})

// Generate API keys
router.post("/generate-api-keys", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    await user.generateApiKeys()

    req.flash("success_msg", "API keys generated successfully")
    res.redirect("/auth/profile")
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error generating API keys")
    res.redirect("/auth/profile")
  }
})

module.exports = router
