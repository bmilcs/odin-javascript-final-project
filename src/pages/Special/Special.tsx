import { getTMDBImageURL, getMovieDetailsURL } from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import useFetch from "@/hooks/useFetch";
import { formatDateNumberOfYearsPassed } from "@/utils/date";
import { useParams } from "react-router-dom";
import "./Special.scss";

// http://localhost:5173/odin-javascript-final-project/specials/1065890
// TODO improve GUI, add Comedian info & other specials
// TODO separate name (small) from special title (large)
// TODO handle specials that haven't been released yet
// TODO ^ red banner, add to coming soon section on homepage
// TODO Hide "Years Ago" if 0

function Special() {
  const { specialId } = useParams();
  const id = specialId ? Number(specialId) : 0;
  const specialURL = getMovieDetailsURL(id);
  const {
    data: specialData,
    error: specialError,
    isLoading: specialIsLoading,
  } = useFetch(specialURL);

  // useEffect(() => {
  //   console.log("specialdata: ", specialData);
  // }, [specialData]);

  return (
    <div className="column">
      {specialData && (
        <div className="special">
          {/* image */}
          {specialData.backdrop_path ? (
            <img
              className="special__image"
              src={getTMDBImageURL(specialData.backdrop_path)}
              alt={`${specialData.title}`}
            />
          ) : specialData.poster_path ? (
            <img
              className="special__image"
              src={getTMDBImageURL(specialData.poster_path)}
              alt={`${specialData.title}`}
            />
          ) : (
            <MicrophoneSVG className="special__image special__svg" />
          )}

          {/* information */}
          <div className="special__content">
            {specialData.title && (
              <h2 className="special__title">{specialData.title}</h2>
            )}

            {specialData.release_date && (
              <>
                <p className="special__years_ago">
                  {formatDateNumberOfYearsPassed(specialData.release_date)}{" "}
                  Years Ago
                </p>
                <p className="special__release_date">
                  {specialData.release_date}
                </p>
              </>
            )}

            {specialData.vote_average && (
              <p className="special__vote_average">
                {specialData.vote_average}/10
              </p>
            )}

            {specialData.runtime && (
              <p className="special__runtime">{specialData.runtime} minutes</p>
            )}

            {specialData.status && specialData.status !== "Released" && (
              <p className="special__status">{specialData.status}</p>
            )}

            {specialData.overview && (
              <p className="special__overview">{specialData.overview}</p>
            )}

            {specialData.homepage && (
              <a className="special__homepage" href={specialData.homepage}>
                Watch It Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Special;
