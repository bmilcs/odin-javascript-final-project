import { useAppSelector } from '@/app/hooks';
import { isUserSignedIn } from '@/app/store';
import Button from '@/components/Button/Button';
import NavBar from '@/components/NavBar/NavBar';
import NotificationIcon from '@/components/NotificationIcon/NotificationIcon';
import SearchBar from '@/components/SearchBar/SearchBar';
import { motion } from 'framer-motion';
import { MdOutlineLogin, MdPerson } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import './Header.scss';

function Header() {
  const navigate = useNavigate();
  const isSignedIn = useAppSelector(isUserSignedIn);

  const signIn = () => {
    navigate('/login');
  };

  const favorites = () => {
    navigate('/favorites');
  };

  return (
    <motion.header
      className='header'
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 50, mass: 0.2 }}
    >
      <div className='column'>
        <Link to='/'>
          <div className='title'>
            {/* <GiMicrophone size={28} className="title__icon" /> */}
            <h3 className='title__text'>
              comedy<span className='title__text__db'>db</span>
            </h3>
          </div>
        </Link>

        <div className='user__icons'>
          {isSignedIn ? (
            <>
              <NotificationIcon />
              <Button type='icon' ariaLabel='Favorites Page' onClick={() => favorites()}>
                <MdPerson size={26} className='' />
              </Button>
            </>
          ) : (
            <Button type='icon' ariaLabel='Sign In' onClick={() => signIn()}>
              <MdOutlineLogin size={26} className='' />
            </Button>
          )}
        </div>

        <NavBar />

        <div className='break-column'></div>

        <SearchBar />
      </div>
    </motion.header>
  );
}

export default Header;
