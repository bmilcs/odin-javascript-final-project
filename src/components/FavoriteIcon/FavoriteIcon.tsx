import "./FavoriteIcon.scss";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  toggleUserFavorite,
  userFavorites,
} from "@/features/userSlice/userSlice";

type Props = {
  favoriteId: string;
};

function FavoriteIcon({ favoriteId }: Props) {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(userFavorites);
  const isFavorite = favorites.includes(favoriteId);

  const handleToggleFavorite = () => {
    dispatch(toggleUserFavorite(favoriteId));
  };

  return (
    <div className="heart" onClick={() => handleToggleFavorite()}>
      {isFavorite && <MdOutlineFavorite size={22} className="heart__full" />}
      {!isFavorite && (
        <MdOutlineFavoriteBorder size={22} className="heart__empty" />
      )}
    </div>
  );

  // if exists in favorites, show full red heart
  // else show hollow heart
  // onclick, toggle it as a favorite
}

export default FavoriteIcon;
