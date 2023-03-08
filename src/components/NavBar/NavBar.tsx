import { useAppSelector } from '@/app/hooks';
import Button from '@/components/Button/Button';
import { isUserSignedIn } from '@/features/userSlice/userSlice';
import { signUserInWithGooglePopup, signUserOutFromFirebase } from '@/firebase/authentication';
import useOnClickOutside from '@/hooks/useClickOutside';
import { useRef, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { MdClose, MdMenu, MdOutlineLogin } from 'react-icons/md';
import { Link } from 'react-router-dom';
import './NavBar.scss';

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const isSignedIn = useAppSelector(isUserSignedIn);

  const signIn = () => {
    signUserInWithGooglePopup();
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLUListElement, MouseEvent>) => {
    if (e.target instanceof HTMLAnchorElement) setIsOpen(false);
  };

  useOnClickOutside(menuRef, () => setIsOpen(false));

  return (
    <nav className='nav' ref={menuRef}>
      <ul
        className={`nav__ul ${isOpen ? 'nav__active' : 'nav__hidden'}`}
        onClick={(e) => handleMenuClick(e)}
      >
        <li className='nav__li'>
          <Link to='/' className='nav__a'>
            Home
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/comedians' className='nav__a'>
            Comedians
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/specials' className='nav__a'>
            Specials
          </Link>
        </li>
        <li className='nav__li'>
          <Link to='/favorites' className='nav__a'>
            Favorites
          </Link>
        </li>

        {isSignedIn ? (
          <Button type='icon' onClick={() => signUserOutFromFirebase()}>
            <FaUserCircle size={26} className='' />
          </Button>
        ) : (
          <Button type='icon' onClick={() => signIn()}>
            <MdOutlineLogin size={26} className='' />
          </Button>
        )}
      </ul>

      <button className='nav__button' onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <MdClose size={30} className='nav__icon nav__icon-open' />
        ) : (
          <MdMenu size={30} className='nav__icon nav__icon-closed' />
        )}
      </button>
    </nav>
  );
}

export default NavBar;
