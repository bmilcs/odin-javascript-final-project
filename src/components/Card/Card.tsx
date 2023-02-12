import "./Card.scss";

interface Props {
  dataAttribute: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ dataAttribute, children, className }: Props) {
  return (
    <article
      data-tmdb-id={dataAttribute}
      className={`card ${className ? className : ""}`}
    >
      {children}
    </article>
  );
}

export default Card;
