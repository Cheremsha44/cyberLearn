import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Card } from '../../components/ui/Card/Card';
import FormAlert from '../../components/ui/FormAlert/FormAlert';
import './LoginPage.css';
import { loginUser } from '../../services/api';

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getRetryAfterSeconds(error) {
  if (typeof error?.retryAfterSeconds === 'number' && error.retryAfterSeconds > 0) {
    return error.retryAfterSeconds;
  }

  if (typeof error?.retryAfterMinutes === 'number' && error.retryAfterMinutes > 0) {
    return error.retryAfterMinutes * 60;
  }

  if (error?.lockedUntil) {
    const lockTimestamp = new Date(error.lockedUntil).getTime();

    if (!Number.isNaN(lockTimestamp)) {
      return Math.max(0, Math.ceil((lockTimestamp - Date.now()) / 1000));
    }
  }

  return 0;
}

function normalizeAuthError(error) {
  if (!error) {
    return 'Не удалось выполнить вход';
  }

  if (error.code === 'AUTH_MISSING_CREDENTIALS') {
    return 'Введите email и пароль';
  }

  if (error.code === 'AUTH_USER_BLOCKED') {
    return 'Аккаунт заблокирован. Обратитесь к администратору';
  }

  if (error.code === 'AUTH_LOGIN_LOCKED') {
    const retryAfterSeconds = getRetryAfterSeconds(error);
    const lockDurationMinutes =
      typeof error.lockDurationMinutes === 'number' ? error.lockDurationMinutes : 30;

    return retryAfterSeconds > 0
      ? `Слишком много попыток входа. Аккаунт временно заблокирован на ${lockDurationMinutes} минут. Повторить можно через ${formatCountdown(retryAfterSeconds)}.`
      : error.message ||
          `Слишком много попыток входа. Аккаунт временно заблокирован на ${lockDurationMinutes} минут.`;
  }

  if (error.code === 'AUTH_INVALID_CREDENTIALS' && typeof error.attemptsLeft === 'number') {
    return `Неверный email или пароль. Осталось попыток: ${error.attemptsLeft}`;
  }

  return error.message || 'Не удалось выполнить вход';
}

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  useEffect(() => {
    if (!lockExpiresAt) {
      setLockSecondsLeft(0);
      return undefined;
    }

    const syncCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((lockExpiresAt - Date.now()) / 1000));
      setLockSecondsLeft(secondsLeft);

      if (secondsLeft === 0) {
        setLockExpiresAt(null);
        setError('');
      }
    };

    syncCountdown();
    const intervalId = window.setInterval(syncCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lockExpiresAt]);

  const isTemporarilyLocked = Boolean(lockExpiresAt) && lockSecondsLeft > 0;
  const submitLabel = isLoading
    ? 'Вход...'
    : isTemporarilyLocked
      ? `Повторить через ${formatCountdown(lockSecondsLeft)}`
      : 'Войти';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isTemporarilyLocked) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await loginUser({
        email: formData.email,
        password: formData.password
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('session_start', Date.now());

        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        setLockExpiresAt(null);
        setLockSecondsLeft(0);
        navigate('/dashboard');
      } else {
        setError('Некорректный ответ сервера');
      }
    } catch (submitError) {
      const retryAfterSeconds = getRetryAfterSeconds(submitError);

      if (retryAfterSeconds > 0) {
        setLockExpiresAt(Date.now() + retryAfterSeconds * 1000);
        setLockSecondsLeft(retryAfterSeconds);
      } else {
        setLockExpiresAt(null);
        setLockSecondsLeft(0);
      }

      setError(normalizeAuthError(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    if (error && !isTemporarilyLocked) {
      setError('');
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient"></div>
      <div className="login-bg-gradient-2"></div>

      <motion.div
        className="login-container"
        initial={{
          opacity: 0,
          scale: 0.95
        }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        transition={{
          duration: 0.5
        }}
      >
        <div className="login-header">
          <div className="login-logo">
            <Shield size={24} />
          </div>
          <h1 className="login-title">Добро пожаловать</h1>
          <p className="login-subtitle">Войдите в свой аккаунт CyberLearn</p>
        </div>

        <Card variant="glass" className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Пароль"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock size={16} />}
              required
            />

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Запомнить меня</span>
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate('/forgot-password')}
              >
                Забыли пароль?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="login-button"
              disabled={isLoading || isTemporarilyLocked}
              rightIcon={<ArrowRight size={20} />}
            >
              {submitLabel}
            </Button>

            <FormAlert>{error}</FormAlert>

            <div className="divider">
              <span>или</span>
            </div>

            <button type="button" className="social-button">
              <Github size={20} />
              Войти через GitHub
            </button>
          </form>
        </Card>

        <p className="login-footer">
          Нет аккаунта?{' '}
          <button onClick={() => navigate('/register')} className="register-link">
            Зарегистрироваться
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
