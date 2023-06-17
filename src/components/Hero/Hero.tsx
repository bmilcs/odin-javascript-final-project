import {
  staggerUpContainerVariants,
  staggerUpVariants,
} from '@/animations/fadeInStaggerChildrenUp';
import { useAppSelector } from '@/app/hooks';
import { isUserSignedIn } from '@/app/store';
import Button from '@/components/Button/Button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Hero.scss';

function Hero() {
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  console.log(isUserLoggedIn);

  return (
    <motion.section
      className='hero'
      initial='hidden'
      animate='visible'
      variants={staggerUpContainerVariants}
    >
      <div className='hero__content column'>
        <motion.h1 variants={staggerUpVariants}>Never Miss a Laugh</motion.h1>

        <motion.p variants={staggerUpVariants}>
          The Comedy DB is a platform for keeping you up to date with the latest standup specials
          from all of your favorite comedians. Sign up, add comedians to your list and receive email
          notifications any time they release new content!
        </motion.p>

        <motion.div variants={staggerUpVariants}>
          {isUserLoggedIn ? (
            <Link to='/favorites'>
              <Button className='hero__button'>View Your Favorites</Button>
            </Link>
          ) : (
            <Link to='/signup'>
              <Button className='hero__button'>Sign Up Now</Button>
            </Link>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

export default Hero;
