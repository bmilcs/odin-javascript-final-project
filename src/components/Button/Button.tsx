import './Button.scss';

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void | Promise<void>;
  type?: 'icon' | 'standard' | 'outline' | 'text-only';
  ariaLabel?: string;
}

function Button({ children, className, onClick, type = 'standard', ariaLabel }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`button ${
        type === 'standard'
          ? 'button__standard'
          : type === 'outline'
          ? 'button__outline'
          : type === 'icon'
          ? 'button__icon'
          : 'button__text-only'
      }${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}

export default Button;
