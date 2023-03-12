import Button from '@/components/Button/Button';
import './Hero.scss';

function Hero() {
  return (
    <section className='hero'>
      <div className='hero__content'>
        <h1>Never Miss a Laugh</h1>
        <h4>Get Notified When Your Favorite Comedians Release a New Special</h4>
        <Button className='hero__button'>Sign Up</Button>
      </div>
    </section>
  );
}

export default Hero;
