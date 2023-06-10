import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import './RevealChildren.scss';

interface Props {
  children: JSX.Element;
  width?: 'fit-content' | '100%';
  classes?: string;
}

function RevealChildren({ children, width = 'fit-content', classes }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const mainControls = useAnimation();
  const slideControls = useAnimation();

  useEffect(() => {
    if (inView) {
      mainControls.start('visible');
      slideControls.start('visible');
    }
  }, [inView]);

  return (
    <div ref={ref} style={{ position: 'relative', width }} aria-hidden>
      <motion.div
        className={classes}
        variants={{
          hidden: { opacity: 0, y: 100 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ height: '100%' }}
        initial='hidden'
        animate={mainControls}
        transition={{ duration: 0.5, delay: 0.25 }}
        aria-hidden
      >
        {children}
      </motion.div>
      <motion.div
        variants={{
          hidden: { left: 0 },
          visible: { left: '100%' },
        }}
        initial='hidden'
        animate={slideControls}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          background: 'var(--clr-primary-100)',
          zIndex: 20,
          borderRadius: 'var(--border---border-radius-200)',
        }}
        aria-hidden
      />
    </div>
  );
}

export default RevealChildren;
