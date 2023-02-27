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
import { IComedySpecial } from "@/firebase/database";

function SpecialCard({
  id,
  title,
  backdrop_path,
  poster_path,
  release_date,
}: IComedySpecial) {
  return (
    <>
      <Card className="special-card" dataAttribute={`special-${id}`}>
        <>
          {/* image */}
          <Link to={`/specials/${id}`}>
            {backdrop_path ? (
              <img
                className="special-card__image"
                src={getTMDBImageURL(backdrop_path)}
                alt={`${title}`}
              />
            ) : poster_path ? (
              <img
                className="special-card__image"
                src={getTMDBImageURL(poster_path)}
                alt={`${title}`}
              />
            ) : (
              <MicrophoneSVG className="special-card__image special-card__svg" />
            )}
            {release_date && (
              <p className="special-card__year">
                {formatDateYearOnly(release_date)}
              </p>
            )}
          </Link>

          {/* text details */}
          <div className="special-card__content">
            {title && <p className="special-card__title">{title}</p>}

            <FavoriteIcon favoriteId={`specials-${id}`} />
            {/* {special.vote_average && (
              <p className="special-card__vote">{special.vote_average}</p>
            )} */}
          </div>
        </>
      </Card>
    </>
  );
}

export default SpecialCard;
