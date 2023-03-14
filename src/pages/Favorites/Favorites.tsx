import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  allComediansDataArr,
  allSpecialsDataArr,
  fetchAllSpecials,
  isUserSignedIn,
  userFavorites,
  userName,
} from '@/app/store';
import Button from '@/components/Button/Button';
import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { IComedian, ISpecial } from '@/firebase/database';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Favorites.scss';

// const userFavorites = useAppSelector((state) => state.user.favorites);

function Favorites() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  const allSpecials = useAppSelector(allSpecialsDataArr);
  const allComedians = useAppSelector(allComediansDataArr);
  const favorites = useAppSelector(userFavorites);
  const name = useAppSelector(userName);

  useEffect(() => {
    if (isUserLoggedIn) return;
    navigate('/login');
  }, [isUserLoggedIn]);

  const [sortedSpecials, setSortedSpecials] = useState<ISpecial[]>([]);
  const [sortedComedians, setSortedComedians] = useState<IComedian[]>([]);

  // fetch list of specials (allSpecials is fetched on demand for /specials & /favorites pages)
  // and stored in a redux tool kit slice.
  useEffect(() => {
    if (!allSpecials || allSpecials.length === 0) dispatch(fetchAllSpecials());
    // note: allComedians is fetched by <App /> for search functionality
  }, []);

  useEffect(() => {
    if (!allSpecials || allSpecials.length === 0) return;
    const favoriteSpecialIds = favorites
      .filter((fav) => fav.includes('specials'))
      .map((special) => special.split('-')[1]);
    const sorted = allSpecials
      .filter((special) => favoriteSpecialIds.includes(`${special.id}`))
      .sort((a, b) => (a.title > b.title ? 1 : -1));
    setSortedSpecials(sorted);
  }, [allSpecials, favorites]);

  useEffect(() => {
    if (!allComedians || allComedians.length === 0) return;
    const favoriteComedianIds = favorites
      .filter((fav) => fav.includes('comedians'))
      .map((comedian) => comedian.split('-')[1]);
    const sorted = allComedians
      .filter((comedian) => favoriteComedianIds.includes(`${comedian.id}`))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
    setSortedComedians(sorted);
  }, [allComedians, favorites]);

  return (
    <div className='column'>
      <div className='favorites__header'>
        <h3>{name}'s Favorites</h3>
        <p>
          To add comedians & their work to your favorites, browse the site and click on the heart
          icons associated with the content you like. That's it! You can access your favorites later
          by clicking on the "Favorites" or "Bookmarks" tab.
        </p>

        {sortedComedians.length === 0 && (
          <Button type='text-only' onClick={() => navigate('/comedians')}>
            Find your favorite comedians here.
          </Button>
        )}

        {sortedSpecials.length === 0 && (
          <Button type='text-only' onClick={() => navigate('/specials')}>
            Find your favorite specials here.
          </Button>
        )}
      </div>

      {sortedComedians.length !== 0 && (
        <ComedianGrid title='Favorite Comedians' data={sortedComedians} />
      )}
      {sortedSpecials.length !== 0 && (
        <SpecialsGrid title='Favorite Specials' data={sortedSpecials} />
      )}
    </div>
  );
}

export default Favorites;
