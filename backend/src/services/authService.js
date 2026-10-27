const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const PasswordResetTokenModel = require('../models/passwordResetTokenModel');
const { sendPasswordResetEmail } = require('./mailService');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');

const SALT_ROUNDS = 10;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 30;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);

function createAuthError(status, code, message, details = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  Object.assign(error, details);
  return error;
}

function toValidDate(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRetryAfterMinutes(retryAfterSeconds) {
  if (typeof retryAfterSeconds !== 'number' || retryAfterSeconds <= 0) {
    return LOGIN_LOCK_MINUTES;
  }

  return Math.max(1, Math.ceil(retryAfterSeconds / 60));
}

function formatRetryAfterText(retryAfterSeconds) {
  if (typeof retryAfterSeconds !== 'number' || retryAfterSeconds <= 0) {
    return `${LOGIN_LOCK_MINUTES} минут`;
  }

  const minutes = Math.floor(retryAfterSeconds / 60);
  const seconds = retryAfterSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes} мин. ${seconds} сек.`;
  }

  if (minutes > 0) {
    return `${minutes} мин.`;
  }

  return `${seconds} сек.`;
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getFrontendBaseUrl(origin) {
  const candidates = [process.env.FRONTEND_URL, origin, 'http://localhost:5173'];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return new URL(candidate).origin;
    } catch (error) {
      continue;
    }
  }

  return 'http://localhost:5173';
}

const AuthService = {
  async updateBio({ userId, bio }) {
    return UserModel.updateBio(userId, bio);
  },

  async register({ username, email, password }) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await UserModel.create({
      username,
      email,
      password: hashedPassword
    });

    const user = await UserModel.findById(userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      level: user.level,
      study_hours: user.study_hours,
      avatar: user.avatar,
      created_at: user.created_at
    };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw createAuthError(401, 'AUTH_INVALID_CREDENTIALS', 'Неверный email или пароль');
    }

    if (user.is_blocked === 1) {
      throw createAuthError(403, 'AUTH_USER_BLOCKED', 'Пользователь заблокирован администратором');
    }

    const lockStatus = await UserModel.getLoginLockStatus(user.id);
    if (lockStatus.isLocked) {
      const lockedUntil = toValidDate(lockStatus.lockedUntil);
      const retryAfterSeconds = Number(lockStatus.retryAfterSeconds || 0);

      throw createAuthError(
        429,
        'AUTH_LOGIN_LOCKED',
        `Слишком много попыток входа. Аккаунт временно заблокирован на ${LOGIN_LOCK_MINUTES} минут. Попробуйте снова через ${formatRetryAfterText(retryAfterSeconds)}.`,
        {
          lockedUntil,
          retryAfterSeconds,
          retryAfterMinutes: getRetryAfterMinutes(retryAfterSeconds),
          lockDurationMinutes: LOGIN_LOCK_MINUTES
        }
      );
    }

    if (user.login_locked_until) {
      await UserModel.resetLoginProtection(user.id);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const attemptState = await UserModel.registerFailedLoginAttempt(
        user.id,
        MAX_FAILED_LOGIN_ATTEMPTS,
        LOGIN_LOCK_MINUTES
      );

      if (attemptState.locked) {
        const lockedUntil = toValidDate(attemptState.lockedUntil);
        const retryAfterSeconds = Number(attemptState.retryAfterSeconds || 0);

        throw createAuthError(
          429,
          'AUTH_LOGIN_LOCKED',
          `Слишком много попыток входа. Аккаунт временно заблокирован на ${LOGIN_LOCK_MINUTES} минут. Попробуйте снова через ${formatRetryAfterText(retryAfterSeconds)}.`,
          {
            lockedUntil,
            retryAfterSeconds,
            retryAfterMinutes: getRetryAfterMinutes(retryAfterSeconds),
            lockDurationMinutes: LOGIN_LOCK_MINUTES
          }
        );
      }

      throw createAuthError(
        401,
        'AUTH_INVALID_CREDENTIALS',
        `Неверный email или пароль. Осталось попыток: ${attemptState.attemptsLeft}`,
        {
          attemptsLeft: attemptState.attemptsLeft
        }
      );
    }

    await UserModel.resetLoginProtection(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        level: user.level,
        study_hours: user.study_hours,
        avatar: user.avatar,
        created_at: user.created_at
      }
    };
  },

  async requestPasswordReset({ email, origin }) {
    const genericMessage =
      'Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса пароля';

    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase();

    const user = normalizedEmail ? await UserModel.findByEmail(normalizedEmail) : null;
    if (!user) {
      return {
        message: genericMessage
      };
    }

    await PasswordResetTokenModel.invalidateActiveTokensForUser(user.id);

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    const resetTokenId = await PasswordResetTokenModel.create({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const frontendBaseUrl = getFrontendBaseUrl(origin);
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES
      });

      return {
        message: genericMessage
      };
    } catch (error) {
      await PasswordResetTokenModel.deleteById(resetTokenId);
      throw createAuthError(
        500,
        'AUTH_RESET_EMAIL_FAILED',
        'Не удалось отправить письмо для сброса пароля'
      );
    }
  },

  async resetPassword({ token, password }) {
    if (!password || password.length < 6) {
      throw createAuthError(
        400,
        'AUTH_PASSWORD_TOO_SHORT',
        'Пароль должен содержать минимум 6 символов'
      );
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await PasswordResetTokenModel.findByTokenHash(tokenHash);

    if (!resetToken) {
      throw createAuthError(
        400,
        'AUTH_RESET_TOKEN_INVALID',
        'Ссылка для сброса пароля недействительна'
      );
    }

    if (resetToken.used_at) {
      throw createAuthError(
        400,
        'AUTH_RESET_TOKEN_USED',
        'Эта ссылка для сброса пароля уже использована'
      );
    }

    const expiresAt = toValidDate(resetToken.expires_at);
    if (!expiresAt || expiresAt.getTime() <= Date.now()) {
      throw createAuthError(
        400,
        'AUTH_RESET_TOKEN_EXPIRED',
        'Срок действия ссылки для сброса пароля истек'
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await UserModel.updatePassword(resetToken.user_id, passwordHash);
    await UserModel.resetLoginProtection(resetToken.user_id);
    await PasswordResetTokenModel.invalidateActiveTokensForUser(resetToken.user_id);

    return {
      message: 'Пароль успешно обновлен'
    };
  }
};

module.exports = AuthService;
