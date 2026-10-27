import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Send, ShieldQuestion } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Card } from '../../components/ui/Card/Card';
import FormAlert from '../../components/ui/FormAlert/FormAlert';
import { requestPasswordReset } from '../../services/api';
import './ForgotPasswordPage.css';

function normalizeForgotPasswordError(error) {
  if (!error) {
    return 'Не удалось отправить письмо для сброса пароля';
  }

  if (error.code === 'AUTH_EMAIL_REQUIRED') {
    return 'Введите email';
  }

  if (error.code === 'AUTH_RESET_EMAIL_FAILED') {
    return 'Не удалось отправить письмо. Проверьте настройки почты и попробуйте снова.';
  }

  return error.message || 'Не удалось отправить письмо для сброса пароля';
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await requestPasswordReset({
        email,
        origin: window.location.origin
      });

      setSuccess(
        result.message ||
          'Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса пароля'
      );
    } catch (submitError) {
      setError(normalizeForgotPasswordError(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-bg-gradient"></div>
      <div className="forgot-password-bg-gradient-2"></div>

      <motion.div
        className="forgot-password-container"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="forgot-password-header">
          <div className="forgot-password-logo">
            <ShieldQuestion size={24} />
          </div>
          <h1 className="forgot-password-title">Сброс пароля</h1>
          <p className="forgot-password-subtitle">
            Укажите email, и мы отправим ссылку для создания нового пароля
          </p>
        </div>

        <Card variant="glass" className="forgot-password-card">
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              icon={<Mail size={16} />}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="forgot-password-submit"
              disabled={isLoading}
              rightIcon={<Send size={18} />}
            >
              {isLoading ? 'Отправка...' : 'Отправить ссылку'}
            </Button>

            <FormAlert>{error}</FormAlert>
            <FormAlert variant="success">{success}</FormAlert>
          </form>
        </Card>

        <button
          type="button"
          className="forgot-password-back"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={16} />
          Вернуться ко входу
        </button>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
