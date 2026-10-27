import './Input.css';
export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}) {
  return <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''}`} {...props} />
      </div>
      {error && <span className="input-error-text">
          <span className="input-error-dot"></span>
          {error}
        </span>}
    </div>;
}
