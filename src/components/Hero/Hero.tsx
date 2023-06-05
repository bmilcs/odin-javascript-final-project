import {
  staggerUpContainerVariants,
  staggerUpVariants,
} from '@/animations/fadeInStaggerChildrenUp';
import Button from '@/components/Button/Button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Hero.scss';

function Hero() {
  const navigate = useNavigate();

  return (
    <motion.section
      className='hero'
      initial='hidden'
      animate='visible'
      variants={staggerUpContainerVariants}
    >
      <div className='hero__content'>
        <motion.h1 variants={staggerUpVariants}>Never Miss a Laugh</motion.h1>
        <motion.h4 variants={staggerUpVariants}>
          Get Notified When Your Favorite Comedians Release a New Special
        </motion.h4>
        <motion.div variants={staggerUpVariants}>
          <Button className='hero__button' onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default Hero;
