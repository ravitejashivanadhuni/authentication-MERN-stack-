const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        user.googleId = profile.id;
        await user.save();
      } else {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          isVerified: true,
          password: Math.random().toString(36).slice(-8) // Generate a random password
        });
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/github/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });

    if (!user) {
      const email = profile.emails ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ email });
      }
      
      if (user) {
        user.githubId = profile.id;
        await user.save();
      } else {
        user = await User.create({
          githubId: profile.id,
          email: email || `${profile.id}@github.com`,
          firstName: profile.displayName.split(' ')[0],
          lastName: profile.displayName.split(' ')[1] || '',
          isVerified: true,
          password: Math.random().toString(36).slice(-8) // Generate a random password
        });
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
})); 