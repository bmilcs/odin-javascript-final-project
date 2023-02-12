import {
  getTMDBImageURL,
  getIMDBURL,
  IDiscoverMovieResult,
  getMovieDetailsURL,
} from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import SpecialCard from "@/components/SpecialCard/SpecialCard";
import useFetch from "@/hooks/useFetch";
import { formatDateNumberOfYearsPassed } from "@/utils/date";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Special.scss";

// TODO validate incoming api ID

function Comedian() {
  const { specialId } = useParams();
  const id = specialId ? Number(specialId) : 0;
  const specialURL = getMovieDetailsURL(id);
  // const comedianURL = getPersonDetailsURL(id);
  // const {
  //   data: personalData,
  //   error: personalError,
  //   isLoading: personalIsLoading,
  // } = useFetch(comedianURL);
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
            {specialData.homepage && (
              <p className="special__homepage">{specialData.homepage}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Comedian;
