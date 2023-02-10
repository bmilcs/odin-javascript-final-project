import "./Button.scss";

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "icon" | "standard";
}

function Button({ children, className, onClick, type = "standard" }: Props) {
  return (
    <button
      onClick={onClick}
      className={`${className} button ${
        type === "standard" ? "button__standard" : "button__icon"
      }`}
    >
      {children}
    </button>
  );
}

export default Button;
