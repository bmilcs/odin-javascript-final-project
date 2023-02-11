import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import useFetch from "@/hooks/useFetch";
import { getMovieDetailsURL, getTMDBImageURL, getIMDBURL } from "@/api/TMDB";
import Card from "../Card/Card";
import "./SpecialCard.scss";

interface Props {
  id: number;
}

function SpecialCard({ id }: Props) {
  const specialURL = getMovieDetailsURL(id);
  console.log(specialURL);
  const { data, error } = useFetch(specialURL);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <Card type="special">
      {data && (
        <>
          {data.backdrop_path ? (
            <Link to={`/specials/${data.id}`}>
              <img
                className="special__image"
                src={getTMDBImageURL(data.backdrop_path)}
                alt={`${data.title}`}
              />
            </Link>
          ) : data.poster_path ? (
            <Link to={`/specials/${data.id}`}>
              <img
                className="special__image"
                src={getTMDBImageURL(data.poster_path)}
                alt={`${data.title}`}
              />
            </Link>
          ) : (
            ""
          )}
          <div className="special__content">
            {data.title && <p className="special__title">{data.title}</p>}
            {data.release_data && (
              <p className="special__date">{data.release_data}</p>
            )}
            {data.vote_average && (
              <p className="special__vote">{data.vote_average}</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default SpecialCard;
