import "./Card.scss";

interface Props {
  children: React.ReactNode;
  className?: string;
  type?: "comedian" | "special";
}

function Card({ children, className, type = "comedian" }: Props) {
  return (
    <article
      className={`card ${
        type === "comedian" ? "comedian__card" : "standup__card"
      }${className ? ` ${className}` : ""}`}
    >
      {children}
    </article>
  );
}

export default Card;
