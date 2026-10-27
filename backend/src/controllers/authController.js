const AuthService = require('../services/authService');

const AuthController = {
  async me(req, res) {
    return res.json({ user: req.user });
  },

  async updateBio(req, res) {
    try {
      const { bio } = req.body;
      if (typeof bio !== 'string') {
        return res.status(400).json({ message: 'bio must be a string' });
      }

      const updated = await AuthService.updateBio({ userId: req.user.id, bio });
      if (!updated) return res.status(404).json({ message: 'User not found' });

      return res.json({ message: 'Bio updated successfully' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          message: 'All fields are required'
        });
      }

      const user = await AuthService.register({
        username,
        email,
        password
      });

      return res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          code: 'AUTH_MISSING_CREDENTIALS',
          message: 'Email and password are required'
        });
      }

      const { token, user } = await AuthService.login({
        email,
        password
      });

      return res.status(200).json({
        message: 'Login successful',
        token,
        user
      });
    } catch (error) {
      const payload = {
        code: error.code || 'AUTH_LOGIN_FAILED',
        message: error.message
      };

      if (typeof error.attemptsLeft === 'number') {
        payload.attemptsLeft = error.attemptsLeft;
      }

      if (error.lockedUntil) {
        payload.lockedUntil = error.lockedUntil;
      }

      if (typeof error.retryAfterMinutes === 'number') {
        payload.retryAfterMinutes = error.retryAfterMinutes;
      }

      if (typeof error.retryAfterSeconds === 'number') {
        payload.retryAfterSeconds = error.retryAfterSeconds;
      }

      if (typeof error.lockDurationMinutes === 'number') {
        payload.lockDurationMinutes = error.lockDurationMinutes;
      }

      return res.status(error.status || 401).json(payload);
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email, origin } = req.body;

      if (!email) {
        return res.status(400).json({
          code: 'AUTH_EMAIL_REQUIRED',
          message: 'Email is required'
        });
      }

      const result = await AuthService.requestPasswordReset({ email, origin });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        code: error.code || 'AUTH_FORGOT_PASSWORD_FAILED',
        message: error.message
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          code: 'AUTH_RESET_PAYLOAD_REQUIRED',
          message: 'Token and password are required'
        });
      }

      const result = await AuthService.resetPassword({ token, password });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 400).json({
        code: error.code || 'AUTH_RESET_PASSWORD_FAILED',
        message: error.message
      });
    }
  }
};

module.exports = AuthController;
