import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaImdb } from "react-icons/fa";
import useFetch from "@/hooks/useFetch";
import { getPersonDetailsURL, getTMDBImageURL } from "@/api/TMDB";
import Card from "../Card/Card";
import "./ComedianCard.scss";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import FavoriteIcon from "../FavoriteIcon/FavoriteIcon";

interface Props {
  id: number;
}

function ComedianCard({ id }: Props) {
  const personalUrl = getPersonDetailsURL(id);
  const { data, error } = useFetch(personalUrl);

  useEffect(() => {
    console.log("data", data);
  }, [data]);

  return (
    <>
      {data && (
        <Card className="comedian-card" dataAttribute={`comedian-${data.id}`}>
          {/* image */}
          <Link to={`/comedians/${data.id}`}>
            {data.profile_path ? (
              <img
                src={getTMDBImageURL(data.profile_path)}
                alt={`${data.name} Headshot`}
                className="comedian-card__image"
              />
            ) : (
              <MicrophoneSVG className="comedian-card__image comedian-card__svg" />
            )}
          </Link>

          {/* text content */}
          <div className="comedian-card__details">
            {data.name && <p className="comedian-card__name">{data.name}</p>}
            <div className="comedian-card__icons">
              {data.imdb_id && <FaImdb size={20} />}
              <FavoriteIcon favoriteId={`comedian-${data.id}`} />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

export default ComedianCard;
