import { useAppSelector } from '@/app/hooks';
import Button from '@/components/Button/Button';
import NavBar from '@/components/NavBar/NavBar';
import SearchBar from '@/components/SearchBar/SearchBar';
import { isUserSignedIn } from '@/features/userSlice/userSlice';
import { signUserInWithGooglePopup, signUserOutFromFirebase } from '@/firebase/authentication';
import { Link } from 'react-router-dom';
import './Header.scss';

function Header() {
  const isSignedIn = useAppSelector(isUserSignedIn);

  const signIn = () => {
    signUserInWithGooglePopup();
  };

  return (
    <header className='header'>
      <div className='column'>
        <Link to='/'>
          <div className='title'>
            {/* <GiMicrophone size={28} className="title__icon" /> */}
            <h1 className='title__text'>
              comedy<span className='title__text__db'>db</span>
            </h1>
          </div>
        </Link>

        <SearchBar />

        <NavBar />

        {isSignedIn ? (
          <Button type='outline' onClick={() => signUserOutFromFirebase()}>
            logout
          </Button>
        ) : (
          <Button onClick={() => signIn()}>login</Button>
        )}
      </div>
    </header>
  );
}

export default Header;
