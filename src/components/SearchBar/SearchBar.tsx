import { getTMDBImageURL, parseSearchQuery } from '@/api/TMDB';
import { useAppSelector } from '@/app/hooks';
import { allComediansDataArr } from '@/app/store';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import Button from '@/components/Button/Button';
import { IComedian } from '@/firebase/database';
import useOnClickOutside from '@/hooks/useClickOutside';
import { useEffect, useRef, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import './SearchBar.scss';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComedians, setFilteredComedians] = useState<IComedian[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const allComediansData = useAppSelector(allComediansDataArr);

  // when the input value changes
  useEffect(() => {
    if (allComediansData.length === 0) return;

    if (!searchTerm || searchTerm.length < 1) {
      setFilteredComedians([]);
      return;
    }

    setFilteredComedians(
      allComediansData
        .filter((comedian) => {
          return comedian.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase());
        })
        .sort((a, b) => {
          return a.favorites < b.favorites ? 1 : -1;
        })
        .slice(0, 10),
    );
  }, [searchTerm, allComediansData]);

  // when fetch returns data for autocomplete
  useEffect(() => {
    if (filteredComedians) {
      setDropdownVisible(true);
    }
  }, [filteredComedians]);

  const clearHideDropDown = () => {
    setSearchTerm('');
    setDropdownVisible(false);
  };

  useOnClickOutside(searchRef, () => {
    setDropdownVisible(false);
  });

  // when the user submits the search form: enter / click icon
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm) return;

    const term = parseSearchQuery(searchTerm);
    navigate(`/search/${term}`);
    clearHideDropDown();
  };

  // when the user clicks on person in the autocomplete dropdown
  const handleMenuClick = (e: React.MouseEvent) => {
    const elem = e.target as HTMLDivElement;
    const tmdbId = elem.getAttribute('data-tmdb');
    if (!tmdbId) return;

    clearHideDropDown();
    navigate(`/comedians/${tmdbId}`);
  };

  return (
    <div className='search' ref={searchRef}>
      <form className='search__form' onSubmit={(e) => handleSearchSubmit(e)}>
        <input
          type='text'
          id='search-input'
          className='search-input'
          placeholder='comedian name'
          autoComplete='off'
          minLength={3}
          maxLength={64}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          value={searchTerm}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDropdownVisible(false);
          }}
        />

        <Button type='icon' ariaLabel='Submit Search' className='search__button'>
          <MdSearch size={28} />
        </Button>

        {dropdownVisible && filteredComedians && filteredComedians.length !== 0 && (
          <div className='dropdown' onClick={(e) => handleMenuClick(e)}>
            {filteredComedians
              // display tiny image & person's name
              .map((person) => {
                return (
                  <div className='result' data-tmdb={person.id} key={person.id}>
                    {person.profile_path ? (
                      <img
                        src={getTMDBImageURL(person.profile_path)}
                        alt={`${person.name} Headshot`}
                        className='result__photo'
                      />
                    ) : (
                      <MicrophoneSVG className='result__photo result__svg' />
                    )}
                    {person.name && <p className='result__name'>{person.name}</p>}
                  </div>
                );
              })}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
