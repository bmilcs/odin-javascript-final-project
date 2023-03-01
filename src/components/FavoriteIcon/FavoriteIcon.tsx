import React from 'react';
import './FavoriteIcon.scss';
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { isUserSignedIn, toggleUserFavorite, userFavorites } from '@/features/userSlice/userSlice';
import { toggleUserFavoriteInDB } from '@/firebase/functions';
import { IComedian, IComedySpecial } from '@/firebase/database';

type Props = {
  category: string;
  data: IComedySpecial | IComedian;
};

function FavoriteIcon({ category, data }: Props) {
  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  const favorites = useAppSelector(userFavorites);

  // favorites are classified by category-id in /users/.../favorites: []
  const favoriteId = `${category}-${data.id}`;
  const isFavorite = favorites.includes(favoriteId);

  const handleToggleFavorite = () => {
    dispatch(toggleUserFavorite(favoriteId));
    if (isUserLoggedIn) toggleUserFavoriteInDB({ favoriteId, data });
  };

  return (
    <div className='heart' onClick={() => handleToggleFavorite()}>
      {isFavorite ? (
        <MdOutlineFavorite size={22} className='heart__full' />
      ) : (
        <MdOutlineFavoriteBorder size={22} className='heart__empty' />
      )}
    </div>
  );
}

export default FavoriteIcon;
