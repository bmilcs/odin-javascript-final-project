import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import useFetch from "@/hooks/useFetch";
import {
  getMovieDetailsURL,
  getTMDBImageURL,
  TDiscoverMovieResult,
} from "@/api/TMDB";
import Card from "../Card/Card";
import "./SpecialCard.scss";

function SpecialCard({ id }: TDiscoverMovieResult) {
  const specialURL = getMovieDetailsURL(id);
  const { data, error } = useFetch(specialURL);

  return (
    <Card className="special-card">
      {data && (
        <>
          {data.backdrop_path ? (
            <Link to={`/specials/${data.id}`}>
              <img
                className="special-card__image"
                src={getTMDBImageURL(data.backdrop_path)}
                alt={`${data.title}`}
              />
            </Link>
          ) : data.poster_path ? (
            <Link to={`/specials/${data.id}`}>
              <img
                className="special-card__image"
                src={getTMDBImageURL(data.poster_path)}
                alt={`${data.title}`}
              />
            </Link>
          ) : (
            ""
          )}
          <div className="special-card__content">
            {data.title && <p className="special__title">{data.title}</p>}
            {data.release_data && (
              <p className="special-card__date">{data.release_data}</p>
            )}
            {data.vote_average && (
              <p className="special-card__vote">{data.vote_average}</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default SpecialCard;
