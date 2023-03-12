import Button from '@/components/Button/Button';
import { useNavigate } from 'react-router-dom';
import './Hero.scss';

function Hero() {
  const navigate = useNavigate();

  return (
    <section className='hero'>
      <div className='hero__content'>
        <h1>Never Miss a Laugh</h1>
        <h4>Get Notified When Your Favorite Comedians Release a New Special</h4>
        <Button className='hero__button' onClick={() => navigate('/signup')}>
          Sign Up
        </Button>
      </div>
    </section>
  );
}

export default Hero;
