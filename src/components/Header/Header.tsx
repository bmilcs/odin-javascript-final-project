import NavBar from '@/components/NavBar/NavBar';
import SearchBar from '@/components/SearchBar/SearchBar';
import { Link } from 'react-router-dom';
import './Header.scss';

function Header() {
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

        <NavBar />

        <div className='break-column'></div>

        <SearchBar />
      </div>
    </header>
  );
}

export default Header;
