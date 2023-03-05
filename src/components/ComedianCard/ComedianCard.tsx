import { getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import Card from '@/components/Card/Card';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import { IComedian, ISpecialPageComedianData } from '@/firebase/database';
import { Link } from 'react-router-dom';
import './ComedianCard.scss';

interface Props {
  data: IComedian | ISpecialPageComedianData;
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
              <MicrophoneSVG className='comedian-card__image comedian-card__svg' />
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
