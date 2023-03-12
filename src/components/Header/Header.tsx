import { useAppSelector } from '@/app/hooks';
import Button from '@/components/Button/Button';
import NavBar from '@/components/NavBar/NavBar';
import NotificationIcon from '@/components/NotificationIcon/NotificationIcon';
import SearchBar from '@/components/SearchBar/SearchBar';
import { isUserSignedIn } from '@/features/userSlice/userSlice';
import { signUserOutFromFirebase } from '@/firebase/authentication';
import { MdOutlineLogin, MdPerson } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import './Header.scss';

function Header() {
  const navigate = useNavigate();
  const isSignedIn = useAppSelector(isUserSignedIn);

  const signIn = () => {
    navigate('/login');
  };

  return (
    <header className='header'>
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
              <Button type='icon' onClick={() => signUserOutFromFirebase()}>
                <MdPerson size={26} className='' />
              </Button>
            </>
          ) : (
            <Button type='icon' onClick={() => signIn()}>
              <MdOutlineLogin size={26} className='' />
            </Button>
          )}
        </div>

        <NavBar />

        <div className='break-column'></div>

        <SearchBar />
      </div>
    </header>
  );
}

export default Header;
