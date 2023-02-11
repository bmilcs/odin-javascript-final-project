import "./Card.scss";

interface Props {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: Props) {
  return (
    <article className={`card ${className ? className : ""}`}>
      {children}
    </article>
  );
}

export default Card;
