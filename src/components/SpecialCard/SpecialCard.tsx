import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/useFetch";
import { formatDateYearOnly } from "@/utils/date";
import {
  getMovieDetailsURL,
  getTMDBImageURL,
  IDiscoverMovieResult,
} from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import FavoriteIcon from "@/components/FavoriteIcon/FavoriteIcon";
import Card from "@/components/Card/Card";
import "./SpecialCard.scss";

function SpecialCard({ id }: IDiscoverMovieResult) {
  const specialURL = getMovieDetailsURL(id);
  const { data, error } = useFetch(specialURL);
  const [special, setSpecial] = useState<IDiscoverMovieResult | undefined>();

  useEffect(() => {
    if (data && data.title) {
      const { title, ...rest } = data;
      const card_title = title.includes(": ") ? title.split(": ")[1] : title;
      setSpecial({ card_title, title, ...rest });
    }
  }, [data]);

  // useEffect(() => {
  //   console.log("special", special);
  // }, [special]);

  return (
    <>
      {special && (
        <Card className="special-card" dataAttribute={`special-${special.id}`}>
          <>
            {/* image */}
            <Link to={`/specials/${special.id}`}>
              {special.backdrop_path ? (
                <img
                  className="special-card__image"
                  src={getTMDBImageURL(special.backdrop_path)}
                  alt={`${special.title}`}
                />
              ) : special.poster_path ? (
                <img
                  className="special-card__image"
                  src={getTMDBImageURL(special.poster_path)}
                  alt={`${special.title}`}
                />
              ) : (
                <MicrophoneSVG className="special-card__image special-card__svg" />
              )}
              {special.release_date && (
                <p className="special-card__year">
                  {formatDateYearOnly(special.release_date)}
                </p>
              )}
            </Link>

            {/* text details */}
            <div className="special-card__content">
              {special.title && (
                <p className="special-card__title">{special.card_title}</p>
              )}

              <FavoriteIcon favoriteId={`special-${special.id}`} />
              {/* {special.vote_average && (
              <p className="special-card__vote">{special.vote_average}</p>
            )} */}
            </div>
          </>
        </Card>
      )}
    </>
  );
}

export default SpecialCard;
