import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, UserPlus, Mail, User, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Card } from '../../components/ui/Card/Card';
import FormAlert from '../../components/ui/FormAlert/FormAlert';
import './RegisterPage.css';
import { registerUser, loginUser } from '../../services/api';

function normalizeRegisterError(message = '') {
  if (message === 'Email already in use') {
    return 'Этот email уже используется';
  }

  if (message === 'All fields are required') {
    return 'Заполните все обязательные поля';
  }

  if (message === 'Invalid email or password') {
    return 'Ошибка входа после регистрации. Проверьте данные';
  }

  return message || 'Не удалось завершить регистрацию';
}

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreement: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    setErrors((prev) => {
      if (!prev[name] && !prev.api) return prev;
      return {
        ...prev,
        [name]: '',
        api: ''
      };
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.username) {
      newErrors.username = 'Имя пользователя обязательно';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!formData.agreement) {
      newErrors.agreement = 'Необходимо подтвердить согласие';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      const loginRes = await loginUser({
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', loginRes.token);
      localStorage.setItem('session_start', Date.now());
      localStorage.setItem('user', JSON.stringify(loginRes.user));

      navigate('/dashboard');
    } catch (error) {
      setErrors((prev) => ({ ...prev, api: normalizeRegisterError(error.message) }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg-gradient"></div>
      <div className="register-bg-gradient-2"></div>

      <motion.div
        className="register-container"
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
        <div className="register-header">
          <div className="register-logo">
            <BookOpen size={24} />
          </div>
          <h1 className="register-title">Создать аккаунт</h1>
          <p className="register-subtitle">Присоединяйтесь к нашей платформе обучения</p>
        </div>

        <Card variant="glass" className="register-card">
          <form onSubmit={handleSubmit} className="register-form">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail size={16} />}
            />

            <Input
              label="Имя пользователя"
              name="username"
              type="text"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              icon={<User size={16} />}
            />

            <Input
              label="Пароль"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock size={16} />}
            />

            <Input
              label="Подтверждение пароля"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={<CheckCircle size={16} />}
            />

            <div className="agreement-wrapper">
              <label className="agreement-label">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                  <div className="checkbox-checkmark">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <span className="agreement-text">
                  Я понимаю, что платформа предназначена для обучения
                </span>
              </label>
              {errors.agreement && <p className="agreement-error">{errors.agreement}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="register-button"
              disabled={isLoading}
              leftIcon={<UserPlus size={20} />}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <FormAlert>{errors.api}</FormAlert>
          </form>
        </Card>

        <p className="register-footer">
          Уже есть аккаунт?{' '}
          <button onClick={() => navigate('/login')} className="login-link">
            Войти
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
