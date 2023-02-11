import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MdOutlineFavoriteBorder, MdOutlineFavorite } from "react-icons/md";
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
    <Card type="comedian">
      {data && (
        <>
          {data.profile_path && (
            <Link to={`/comedians/${data.id}`}>
              <img
                src={getTMDBImageURL(data.profile_path)}
                alt=""
                className=""
              />
            </Link>
          )}
          <div className="content">
            {data.name && <p className="comedian__birthday">{data.name}</p>}
            {data.popularity && (
              <p className="comedian__popularity">{data.popularity}</p>
            )}
            {data.imdb_id && <MdOutlineFavoriteBorder size={20} />}
          </div>
        </>
      )}
    </Card>
  );
}

export default ComedianCard;
