import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
import { FaImdb } from "react-icons/fa";
import useFetch from "@/hooks/useFetch";
import { getPersonDetailsURL, getTMDBImageURL } from "@/api/TMDB";
import Card from "../Card/Card";
import "./ComedianCard.scss";

interface Props {
  id: number;
}

function ComedianCard({ id }: Props) {
  const personalUrl = getPersonDetailsURL(id);
  const { data, error } = useFetch(personalUrl);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <Card className="comedian-card">
      {data && (
        <>
          {data.profile_path && (
            <Link to={`/comedians/${data.id}`}>
              <img
                src={getTMDBImageURL(data.profile_path)}
                alt={`${data.name} Headshot`}
                className="comedian-card__image"
              />
            </Link>
          )}
          <div className="comedian-card__details">
            {data.name && <p className="comedian-card__name">{data.name}</p>}
            <div className="comedian-card__icons">
              {data.imdb_id && <FaImdb size={20} />}
              <MdOutlineFavoriteBorder size={20} />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default ComedianCard;
