import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { isUserSignedIn, toggleUserFavorite, userFavorites } from '@/app/store';
import Button from '@/components/Button/Button';
import {
  IComedian,
  IComedianPageSpecialOrAppearance,
  ISpecial,
  ISpecialPageComedianData,
} from '@/firebase/database';
import { toggleUserFavoriteInDB } from '@/firebase/functions';
import { MdOutlineFavorite, MdOutlineFavoriteBorder } from 'react-icons/md';
import './FavoriteIcon.scss';

type Props = {
  category: string;
  data: ISpecial | IComedian | IComedianPageSpecialOrAppearance | ISpecialPageComedianData;
};

function FavoriteIcon({ category, data }: Props) {
  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  const favorites = useAppSelector(userFavorites);

  // favorites are classified by category-id in /users/.../favorites: []
  const favoriteId = `${category}-${data.id}`;
  const isFavorite = favorites.includes(favoriteId);

  const handleToggleFavorite = () => {
    if (!isUserLoggedIn) return;

    dispatch(toggleUserFavorite(favoriteId));
    toggleUserFavoriteInDB({ favoriteId, data });
  };

  return (
    <Button type='icon' className='heart' onClick={() => handleToggleFavorite()}>
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
