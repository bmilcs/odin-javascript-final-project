import { Link } from 'react-router-dom';
import './NavBar.scss';

function NavBar() {
  return (
    <nav className='nav'>
      <ul className='nav__ul'>
        <li className='nav__li'>
          <Link to='/' className='nav__a'>
            Home
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/all/comedians' className='nav__a'>
            Comedians
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/all/specials' className='nav__a'>
            Specials
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/' className='nav__a'>
            Favorites
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
