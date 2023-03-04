import { getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import {
  ISpecialPageData,
  ISpecialPageOtherContent,
  getSpecialOrAppearancePageFromDB,
} from '@/firebase/database';
import { formatDateNumberOfYearsPassed, isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Special.scss';

// http://localhost:5173/odin-javascript-final-project/specials/1065890
// TODO improve GUI, add Comedian info & other specials
// TODO separate name (small) from special title (large)
// TODO handle specials that haven't been released yet
// TODO ^ red banner, add to coming soon section on homepage
// TODO Hide "Years Ago" if 0

function Special() {
  const { specialId } = useParams();
  const [specialData, setSpecialData] = useState<ISpecialPageData | null>(null);
  const [otherContentData, setOtherContentData] = useState<ISpecialPageOtherContent[] | null>(null);

  useEffect(() => {
    const getDataFromDB = async () => {
      const pageRawData = await getSpecialOrAppearancePageFromDB(Number(specialId));
      if (pageRawData) {
        setSpecialData(pageRawData.data);
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

  return (
    <div className='column'>
      {specialData && (
        <div className='special'>
          {/* image */}
          {specialData.backdrop_path ? (
            <img
              className='special__image'
              src={getTMDBImageURL(specialData.backdrop_path)}
              alt={`${specialData.title}`}
            />
          ) : specialData.poster_path ? (
            <img
              className='special__image'
              src={getTMDBImageURL(specialData.poster_path)}
              alt={`${specialData.title}`}
            />
          ) : (
            <MicrophoneSVG className='special__image special__svg' />
          )}

          {/* information */}
          <div className='special__content'>
            {specialData.title && <h2 className='special__title'>{specialData.title}</h2>}

            {specialData.release_date && (
              <>
                <p className='special__years_ago'>
                  {formatDateNumberOfYearsPassed(specialData.release_date)} Years Ago
                </p>
                <p className='special__release_date'>{specialData.release_date}</p>
              </>
            )}

            {specialData.runtime && (
              <p className='special__runtime'>{specialData.runtime} minutes</p>
            )}

            {specialData.status && specialData.status !== 'Released' && (
              <p className='special__status'>{specialData.status}</p>
            )}

            {specialData.overview && <p className='special__overview'>{specialData.overview}</p>}

            {specialData.homepage && (
              <a className='special__homepage' href={specialData.homepage}>
                Watch It Now
              </a>
            )}
          </div>

          {otherContentData && (
            <SpecialsGrid
              title={`Other Specials From ${specialData.comedian}`}
              data={otherContentData}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Special;
