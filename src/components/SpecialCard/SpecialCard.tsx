import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import useFetch from "@/hooks/useFetch";
import {
  getMovieDetailsURL,
  getTMDBImageURL,
  IDiscoverMovieResult,
} from "@/api/TMDB";
import Card from "../Card/Card";
import "./SpecialCard.scss";
import { formatDateYearOnly } from "@/utils/date";
import MicrophoneSVG from "@/assets/MicrophoneSVG";

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

  useEffect(() => {
    console.log("special", special);
  }, [special]);

  return (
    <Card className="special-card">
      {special && (
        <>
          {special.backdrop_path ? (
            <Link to={`/specials/${special.id}`}>
              <img
                className="special-card__image"
                src={getTMDBImageURL(special.backdrop_path)}
                alt={`${special.title}`}
              />
            </Link>
          ) : special.poster_path ? (
            <Link to={`/specials/${special.id}`}>
              <img
                className="special-card__image"
                src={getTMDBImageURL(special.poster_path)}
                alt={`${special.title}`}
              />
            </Link>
          ) : (
            <Link to={`/specials/${special.id}`}>
              <MicrophoneSVG className="special-card__image special-card__svg" />
            </Link>
          )}
          <div className="special-card__content">
            {special.title && (
              <p className="special-card__title">{special.card_title}</p>
            )}
            {special.release_date && (
              <p className="special-card__date">
                {formatDateYearOnly(special.release_date)}
              </p>
            )}
            {/* {special.vote_average && (
              <p className="special-card__vote">{special.vote_average}</p>
            )} */}
          </div>
        </>
      )}
    </Card>
  );
}

export default SpecialCard;
