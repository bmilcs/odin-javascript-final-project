import { getTMDBImageURL } from '@/api/TMDB';
import Card from '@/components/Card/Card';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import MissingImg from '@/components/MissingImg/MissingImg';
import { IComedian, ISpecialPageComedian } from '@/firebase/database';
import { Link } from 'react-router-dom';
import './ComedianCard.scss';

interface Props {
  data: IComedian | ISpecialPageComedian;
}

function ComedianCard({ data }: Props) {
  return (
    <>
      {data && (
        <Card className='comedian-card' dataAttribute={`comedian-${data.id}`}>
          {/* image */}
          <Link to={`/comedians/${data.id}`}>
            {data.profile_path ? (
              <img
                src={getTMDBImageURL(data.profile_path)}
                alt={`${data.name} Headshot`}
                className='comedian-card__image'
              />
            ) : (
              <MissingImg
                className='comedian-card__image comedian-card__svg'
                alt={`${data.name} Headshot`}
              />
            )}
          </Link>

          {/* text content */}
          <div className='comedian-card__details'>
            {data.name && <p className='comedian-card__name'>{data.name}</p>}
            <div className='comedian-card__icons'>
              <FavoriteIcon category={'comedians'} data={data} />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

export default ComedianCard;
