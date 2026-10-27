import { AlertCircle, CheckCircle2 } from 'lucide-react';
import './FormAlert.css';

function FormAlert({ children, variant = 'error', className = '' }) {
  if (!children) return null;

  const isSuccess = variant === 'success';
  const variantClass = isSuccess ? 'form-alert-success' : 'form-alert-error';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <p className={`form-alert ${variantClass} ${className}`} role="alert" aria-live="polite">
      <Icon size={16} />
      <span>{children}</span>
    </p>
  );
}

export default FormAlert;
