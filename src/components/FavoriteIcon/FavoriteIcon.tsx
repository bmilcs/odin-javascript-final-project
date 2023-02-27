import "./FavoriteIcon.scss";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  isUserSignedIn,
  toggleUserFavorite,
  userFavorites,
} from "@/features/userSlice/userSlice";
import { toggleUserFavoriteInDB } from "@/firebase/functions";

type Props = {
  favoriteId: string;
};

function FavoriteIcon({ favoriteId }: Props) {
  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);
  const favorites = useAppSelector(userFavorites);
  const isFavorite = favorites.includes(favoriteId);

  const handleToggleFavorite = () => {
    dispatch(toggleUserFavorite(favoriteId));
    if (isUserLoggedIn) toggleUserFavoriteInDB({ favoriteId });
  };

  return (
    <div className="heart" onClick={() => handleToggleFavorite()}>
      {isFavorite ? (
        <MdOutlineFavorite size={22} className="heart__full" />
      ) : (
        <MdOutlineFavoriteBorder size={22} className="heart__empty" />
      )}
    </div>
  );
}

export default FavoriteIcon;
