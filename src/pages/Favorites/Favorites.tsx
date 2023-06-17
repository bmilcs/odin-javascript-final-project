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
import PageTransition from '@/components/PageTransition/PageTransition';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { signUserOutFromFirebase } from '@/firebase/authentication';
import { IComedian, ISpecial } from '@/firebase/database';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <PageTransition>
      <>
        <div className='favorites column'>
          <h3>Your Favorites</h3>

          <p>
            To add comedians & their work to your favorites, browse the site and click on the heart
            icons associated with the content you like. That&apos;s it! You can access your
            favorites later by clicking on the &quot;Favorites&quot;.
          </p>

          <p>
            Any time a favorite comedian releases a new special, you will receive an e-mail
            notification with the details.
          </p>

          {sortedComedians.length === 0 && (
            <Link to='/comedians'>
              <Button type='text-only' className='link__button'>
                Find your favorite comedians here.
              </Button>
            </Link>
          )}

          {sortedSpecials.length === 0 && (
            <Link to='/specials'>
              <Button type='text-only' className='link__button'>
                Find your favorite specials here.
              </Button>
            </Link>
          )}

          <Button type='standard' onClick={() => signUserOutFromFirebase()}>
            Log Out
          </Button>
        </div>

        {sortedComedians.length !== 0 && (
          <ComedianGrid title='Favorite Comedians' data={sortedComedians} />
        )}

        {sortedSpecials.length !== 0 && (
          <SpecialsGrid title='Favorite Specials' data={sortedSpecials} />
        )}
      </>
    </PageTransition>
  );
}

export default Favorites;
