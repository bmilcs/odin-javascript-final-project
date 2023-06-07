import { getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import ComedianCard from '@/components/ComedianCard/ComedianCard';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { ISpecialPageData } from '@/firebase/database';
import useSpecialData from '@/hooks/useSpecialData';
import { formatDateNumberOfYearsPassed, isAFutureDate } from '@/utils/date';
import { useParams } from 'react-router-dom';
import './Special.scss';

// TODO separate name (small) from special title (large)
// TODO handle specials that haven't been released yet
// TODO ^ red banner, add to coming soon section on homepage
// TODO Hide "Years Ago" if 0

function Special() {
  const { specialId } = useParams();
  const { comedian, special, otherContent, mainImageOrientation } = useSpecialData(
    Number(specialId),
  );

  return (
    <div className='column'>
      <>
        {special && (
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
                {special && <SpecialMainImage data={special} />}
                {special && <SpecialInformation data={special} />}
              </div>
            </div>
          </>
        )}

        {comedian && <h3 className='other__content__header'>Other Content From {comedian.name}</h3>}

        <div className='other__content'>
          {comedian && <ComedianCard data={comedian} />}

          {otherContent && comedian && (
            <SpecialsGrid
              // title={`Other Content From ${comedian.name}`}
              data={otherContent}
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
