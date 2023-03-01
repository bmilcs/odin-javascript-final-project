import './Button.scss';

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void | Promise<void>;
  type?: 'icon' | 'standard' | 'outline';
}

function Button({ children, className, onClick, type = 'standard' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`button ${
        type === 'standard'
          ? 'button__standard'
          : type === 'outline'
          ? 'button__outline'
          : 'button__icon'
      }${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}

export default Button;
