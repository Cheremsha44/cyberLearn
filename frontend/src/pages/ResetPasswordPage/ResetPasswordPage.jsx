import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Card } from '../../components/ui/Card/Card';
import FormAlert from '../../components/ui/FormAlert/FormAlert';
import { resetPassword } from '../../services/api';
import './ResetPasswordPage.css';

function normalizeResetPasswordError(error) {
  if (!error) {
    return 'Не удалось обновить пароль';
  }

  if (error.code === 'AUTH_RESET_PAYLOAD_REQUIRED') {
    return 'Ссылка для сброса пароля недействительна';
  }

  if (
    error.code === 'AUTH_RESET_TOKEN_INVALID' ||
    error.code === 'AUTH_RESET_TOKEN_USED' ||
    error.code === 'AUTH_RESET_TOKEN_EXPIRED'
  ) {
    return error.message;
  }

  if (error.code === 'AUTH_PASSWORD_TOO_SHORT') {
    return 'Пароль должен содержать минимум 6 символов';
  }

  return error.message || 'Не удалось обновить пароль';
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Ссылка для сброса пароля недействительна');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({ token, password });
      setSuccess(result.message || 'Пароль успешно обновлен');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(normalizeResetPasswordError(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenMissing = !token;

  return (
    <div className="reset-password-page">
      <div className="reset-password-bg-gradient"></div>
      <div className="reset-password-bg-gradient-2"></div>

      <motion.div
        className="reset-password-container"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="reset-password-header">
          <div className="reset-password-logo">
            <ShieldCheck size={24} />
          </div>
          <h1 className="reset-password-title">Новый пароль</h1>
          <p className="reset-password-subtitle">
            Создайте новый пароль для своего аккаунта CyberLearn
          </p>
        </div>

        <Card variant="glass" className="reset-password-card">
          <form onSubmit={handleSubmit} className="reset-password-form">
            <Input
              label="Новый пароль"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              icon={<Lock size={16} />}
              required
              disabled={isTokenMissing || Boolean(success)}
            />

            <Input
              label="Подтверждение пароля"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              icon={<KeyRound size={16} />}
              required
              disabled={isTokenMissing || Boolean(success)}
            />

            <Button
              type="submit"
              size="lg"
              className="reset-password-submit"
              disabled={isLoading || isTokenMissing || Boolean(success)}
              rightIcon={success ? <CheckCircle2 size={18} /> : undefined}
            >
              {isLoading ? 'Сохранение...' : success ? 'Пароль обновлен' : 'Сохранить пароль'}
            </Button>

            <FormAlert>{error}</FormAlert>
            <FormAlert variant="success">{success}</FormAlert>
          </form>
        </Card>

        <button
          type="button"
          className="reset-password-back"
          onClick={() => navigate(success ? '/login' : '/forgot-password')}
        >
          <ArrowLeft size={16} />
          {success ? 'Перейти ко входу' : 'Запросить новую ссылку'}
        </button>
      </motion.div>
    </div>
  );
}

export default ResetPasswordPage;
