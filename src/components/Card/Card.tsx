import { motion } from 'framer-motion';
import './Card.scss';

interface Props {
  dataAttribute: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ dataAttribute, children, className }: Props) {
  return (
    <motion.article
      data-tmdb-id={dataAttribute}
      className={`card ${className ? className : ''}`}
      whileHover={{
        y: -5,
        scale: 1.01,
        zIndex: 2,
      }}
    >
      {children}
    </motion.article>
  );
}

export default Card;
