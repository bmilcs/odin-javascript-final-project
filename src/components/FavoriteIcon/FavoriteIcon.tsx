import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { isUserSignedIn, toggleUserFavorite, userFavorites } from '@/features/userSlice/userSlice';
import { IComedian, IComedianPageSpecialOrAppearance, ISpecial } from '@/firebase/database';
import { toggleUserFavoriteInDB } from '@/firebase/functions';
import { MdOutlineFavorite, MdOutlineFavoriteBorder } from 'react-icons/md';
import './FavoriteIcon.scss';

type Props = {
  category: string;
  data: ISpecial | IComedian | IComedianPageSpecialOrAppearance;
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
