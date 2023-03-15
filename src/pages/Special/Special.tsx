import { getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import ComedianCard from '@/components/ComedianCard/ComedianCard';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import {
  ISpecialPageComedianData,
  ISpecialPageData,
  ISpecialPageOtherContent,
  getSpecialOrAppearancePageFromDB,
} from '@/firebase/database';
import { formatDateNumberOfYearsPassed, isAFutureDate, isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Special.scss';

// TODO separate name (small) from special title (large)
// TODO handle specials that haven't been released yet
// TODO ^ red banner, add to coming soon section on homepage
// TODO Hide "Years Ago" if 0

function Special() {
  const { specialId } = useParams();
  const [specialData, setSpecialData] = useState<ISpecialPageData | null>(null);
  const [otherContentData, setOtherContentData] = useState<ISpecialPageOtherContent[] | null>(null);
  const [comedianData, setComedianData] = useState<ISpecialPageComedianData | null>(null);
  const [mainImageOrientation, setMainImageOrientation] = useState<
    'landscape' | 'portrait' | 'missing'
  >();

  useEffect(() => {
    const getDataFromDB = async () => {
      const pageRawData = await getSpecialOrAppearancePageFromDB(Number(specialId));
      if (pageRawData) {
        setSpecialData(pageRawData.data);
        setComedianData(pageRawData.comedian);
        if (pageRawData.otherContent.length > 0) {
          pageRawData.otherContent.sort((a, b) => {
            return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
          });
          setOtherContentData(pageRawData.otherContent);
        }
      }
    };
    getDataFromDB();
  }, [specialId]);

  useEffect(() => {
    if (!specialData) return;
    if (specialData.backdrop_path) {
      setMainImageOrientation('landscape');
    } else if (specialData.poster_path) {
      setMainImageOrientation('portrait');
    } else {
      setMainImageOrientation('missing');
    }
  }, [specialData]);

  return (
    <div className='column'>
      <>
        {specialData && (
          <>
            <div className='special'>
              <div
                className={
                  mainImageOrientation === 'landscape'
                    ? 'special__landscape'
                    : mainImageOrientation === 'portrait'
                    ? 'special__portrait'
                    : 'missing'
                }
              >
                {specialData && <SpecialMainImage data={specialData} />}
                {specialData && <SpecialInformation data={specialData} />}
              </div>
            </div>
          </>
        )}

        {comedianData && (
          <h3 className='other__content__header'>Other Content From {comedianData.name}</h3>
        )}

        <div className='other__content'>
          {comedianData && <ComedianCard data={comedianData} />}

          {otherContentData && comedianData && (
            <SpecialsGrid
              // title={`Other Content From ${comedianData.name}`}
              data={otherContentData}
            />
          )}
        </div>
      </>
    </div>
  );
}

type TSpecialMainImage = {
  data: ISpecialPageData;
};

function SpecialMainImage({ data }: TSpecialMainImage) {
  return (
    <>
      {data.backdrop_path ? (
        <img
          className='special__image special__image-landscape'
          src={getTMDBImageURL(data.backdrop_path)}
          alt={`${data.title}`}
        />
      ) : data.poster_path ? (
        <img
          className='special__image special__image-portrait'
          src={getTMDBImageURL(data.poster_path)}
          alt={`${data.title}`}
        />
      ) : (
        <MicrophoneSVG className='special__image special__image-svg' />
      )}
    </>
  );
}

type SpecialInformationProps = { data: ISpecialPageData };

function SpecialInformation({ data }: SpecialInformationProps) {
  const yearsAgo = formatDateNumberOfYearsPassed(data.release_date);
  const isNotReleasedYet = isAFutureDate(data.release_date);

  return (
    <div className='special__data'>
      {data.title && <h2 className='special__title'>{data.title}</h2>}

      {data.release_date && (
        <>
          <p className='special__release_date'>{data.release_date}</p>
          {isNotReleasedYet ? (
            <p className='special__comingsoon'>Coming soon!</p>
          ) : (
            <p className='special__years_ago'>
              {yearsAgo === 0
                ? 'Less than a year old'
                : `${yearsAgo} Year${yearsAgo > 1 && 's'} Old`}
            </p>
          )}
        </>
      )}

      {data.runtime && <p className='special__runtime'>{data.runtime} minutes</p>}

      {data.status && data.status !== 'Released' && (
        <p className='special__status'>{data.status}</p>
      )}

      {data.id && <FavoriteIcon category='specials' data={data} />}

      {data.overview && <p className='special__overview'>{data.overview}</p>}

      {data.homepage && (
        <a className='special__homepage' href={data.homepage}>
          Watch It Now
        </a>
      )}
    </div>
  );
}

export default Special;
