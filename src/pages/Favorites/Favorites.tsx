import { useAppDispatch, useAppSelector } from '@/app/hooks';
import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { allComediansDataArr } from '@/features/allComediansSlice/allComediansSlice';
import { allSpecialsDataArr, fetchAllSpecials } from '@/features/allSpecialsSlice/allSpecialsSlice';
import { isUserSignedIn, userFavorites } from '@/features/userSlice/userSlice';
import { IComedian, ISpecial } from '@/firebase/database';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Favorites.scss';

// const userFavorites = useAppSelector((state) => state.user.favorites);

function Favorites() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);

  useEffect(() => {
    if (isUserLoggedIn) return;
    navigate('/login');
  }, [isUserLoggedIn]);

  const allSpecials = useAppSelector(allSpecialsDataArr);
  const allComedians = useAppSelector(allComediansDataArr);
  const favorites = useAppSelector(userFavorites);
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
      .filter((special) => favoriteSpecialIds.includes(special.id.toString()))
      .sort((a, b) => (a.title > b.title ? 1 : -1));
    setSortedSpecials(sorted);
  }, [allSpecials, favorites]);

  useEffect(() => {
    if (!allComedians || allComedians.length === 0) return;
    const favoriteComedianIds = favorites
      .filter((fav) => fav.includes('comedians'))
      .map((comedian) => comedian.split('-')[1]);
    const sorted = allComedians
      .filter((comedian) => favoriteComedianIds.includes(comedian.id.toString()))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
    setSortedComedians(sorted);
  }, [allComedians, favorites]);

  return (
    <div className='column'>
      {sortedComedians && sortedComedians.length !== 0 && (
        <ComedianGrid title='Favorite Comedians' data={sortedComedians} />
      )}
      {sortedSpecials && sortedSpecials.length !== 0 && (
        <SpecialsGrid title='Favorite Specials' data={sortedSpecials} />
      )}
    </div>
  );
}

export default Favorites;
