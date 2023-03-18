import { BsGithub } from 'react-icons/bs';
import './Footer.scss';

function Footer() {
  return (
    <footer className='footer'>
      <div className='column'>
        <a href='https://github.com/bmilcs/odin-javascript-final-project'>
          created by <span>bmilcs</span>
          <BsGithub size={22} />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
