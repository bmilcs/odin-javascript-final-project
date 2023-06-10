import { motion } from 'framer-motion';
import './PageTransition.scss';

interface Props {
  children: JSX.Element;
  classes?: string;
}

function PageTransition({ children, classes }: Props) {
  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      aria-hidden
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
