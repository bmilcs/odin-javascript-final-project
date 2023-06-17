import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { isUserSignedIn, toggleUserFavorite, userFavorites } from '@/app/store';
import Button from '@/components/Button/Button';
import { IComedian, IReleaseCard, ISpecial, ISpecialPageComedian } from '@/firebase/database';
import { toggleUserFavoriteInDB } from '@/firebase/functions';
import { useState } from 'react';
import { MdOutlineFavorite, MdOutlineFavoriteBorder } from 'react-icons/md';
import './FavoriteIcon.scss';

type Props = {
  category: string;
  data: ISpecial | IComedian | IReleaseCard | ISpecialPageComedian;
};

function FavoriteIcon({ category, data }: Props) {
  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  const favorites = useAppSelector(userFavorites);
  const [isPending, setIsPending] = useState(false);

  // favorites are classified by category-id in /users/.../favorites: []
  const favoriteId = `${category}-${data.id}`;
  const isFavorite = favorites.includes(favoriteId);

  const handleToggleFavorite = async () => {
    if (!isUserLoggedIn || isPending) return;

    setIsPending(true);
    dispatch(toggleUserFavorite(favoriteId));

    try {
      await toggleUserFavoriteInDB({ favoriteId, data });
    } catch (e) {
      console.log(e);
    }

    setIsPending(false);
  };

  return (
    <Button
      type='icon'
      ariaLabel={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
      className='heart'
      onClick={() => handleToggleFavorite()}
    >
      {isUserLoggedIn ? (
        isFavorite ? (
          <MdOutlineFavorite size={22} className='heart__full' />
        ) : (
          <MdOutlineFavoriteBorder size={22} className='heart__empty' />
        )
      ) : (
        <MdOutlineFavoriteBorder size={22} className='heart__empty-loggedout' />
      )}
    </Button>
  );
}

export default FavoriteIcon;
