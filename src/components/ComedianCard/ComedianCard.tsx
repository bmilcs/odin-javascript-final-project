import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaImdb } from "react-icons/fa";
import { getPersonDetailsURL, getTMDBImageURL } from "@/api/TMDB";
import Card from "@/components/Card/Card";
import FavoriteIcon from "@/components/FavoriteIcon/FavoriteIcon";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import useFetch from "@/hooks/useFetch";
import "./ComedianCard.scss";
import { IComedian } from "@/firebase/database";

interface Props {
  data: IComedian;
}

function ComedianCard({ data }: Props) {
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
              <FavoriteIcon category={`comedians`} data={data} />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

export default ComedianCard;
