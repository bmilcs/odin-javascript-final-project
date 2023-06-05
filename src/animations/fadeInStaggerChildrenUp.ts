export const staggerUpContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      duration: 0.75,
      staggerChildren: 0.35,
      // delayChildren: 0.1,
    },
  },
};

export const staggerUpVariants = {
  hidden: {
    opacity: 0,
    y: '100%',
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 50,
      mass: 0.1,
      // remove delay: 0.3,
    },
  },
};
