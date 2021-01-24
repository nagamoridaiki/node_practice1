"use strict";

const User = require("../models/user"),

const passport = require("passport"),

getUserParams = body => {
  return {
    name: body.name,
    email: body.email,
    password: body.password,
  };
};

module.exports = {
  index: (req, res, next) => {
    User.find()
      .then(users => {
        res.locals.users = users;
        next();
      })
      .catch(error => {
        console.log(`Error fetching users: ${error.message}`);
        next(error);
      });
  },
  indexView: (req, res) => {
    res.render("users/index");
  },

  new: (req, res) => {
    res.render("users/new");
  },

  create: (req, res, next) => {
    if (req.skip) return next();
    const newUser = new User(getUserParams(req.body));
    User.register(newUser, req.body.password, (e, user) => {
      if (user) {
        req.flash("success", `${user.name}'s account created successfully!`);
        res.locals.redirect = "/users/";
        next();
      } else {
        req.flash("error", `Failed to create user account because: ${e.message}.`);
        res.locals.redirect = "/users/new";
        next();
      }
    });
  },

  redirectView: (req, res, next) => {
    const redirectPath = res.locals.redirect;
    if (redirectPath !== undefined) res.redirect(redirectPath);
    else next();
  },

  delete: (req, res, next) => {
    const userId = req.params.id;
    User.findByIdAndRemove(userId)
      .then(() => {
        res.locals.redirect = "/users";
        next();
      })
      .catch(error => {
        console.log(`Error deleting user by ID: ${error.message}`);
        next();
      });
  },

  login: (req, res) => {
    res.render("users/login");
  },
  validate: (req, res, next) => {
    req
      .sanitizeBody("email")
      .normalizeEmail({
        all_lowercase: true
      })
      .trim();
    req.check("email", "Email is invalid").isEmail();
    req.check("password", "Password cannot be empty").notEmpty();
    req.check('password').isLength({ min: 7 }).withMessage("Password must be at least 7 characters");
    req.check('passwordConfirm').custom(() => {
      if (req.body.password === req.body.passwordConfirm) {
        return true;
      } else {
        return false;
      }
    }).withMessage("Passwords don't match.");

    req.getValidationResult().then(error => {
      if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        req.skip = true;
        req.flash("error", messages.join(" and "));
        res.locals.redirect = "/users/new";
        next();
      } else {
        next();
      }
    });
  },
  authenticate: passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: "Failed to login.",
    successRedirect: "/users",
    successFlash: "Logged in!"
  }),
  logout: (req, res, next) => {
    req.logout();
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
  }
};
