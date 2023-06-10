import { getTMDBImageURL } from '@/api/TMDB';
import Card from '@/components/Card/Card';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import { IComedianPageSpecialOrAppearance, ISpecial } from '@/firebase/database';
import { formatDateYearOnly } from '@/utils/date';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import emptyStageImg from '../../assets/empty-stage.jpg';
import './SpecialCard.scss';

type TProps = { data: IComedianPageSpecialOrAppearance | ISpecial };

function SpecialCard({ data }: TProps) {
  const { id, title, backdrop_path, poster_path, release_date } = data;
  const [comedianName, setComedianName] = useState('');
  const [specialName, setSpecialName] = useState('');

  useEffect(
    function separateComedianNameFromTitle() {
      if (!title) return;

      if (title.match(':')) {
        const [comedian, special] = title.split(': ');
        setComedianName(comedian);
        setSpecialName(special);
      } else {
        setComedianName('Various');
        setSpecialName(title);
      }
    },
    [title],
  );

  return (
    <Card className='special-card' dataAttribute={`special-${id}`}>
      {/* image */}
      <Link to={`/specials/${id}`}>
        {poster_path ? (
          <img
            className='special-card__image'
            src={getTMDBImageURL(poster_path)}
            alt={`${title}`}
          />
        ) : backdrop_path ? (
          <img
            className='special-card__image'
            src={getTMDBImageURL(backdrop_path)}
            alt={`${title}`}
          />
        ) : (
          <img src={emptyStageImg} className='special-card__image missing-image' alt={title} />
        )}
        {release_date && <p className='special-card__year'>{formatDateYearOnly(release_date)}</p>}
      </Link>
      {/* </div> */}

      {/* text details */}
      <div className='special-card__content'>
        <div className='special-card__content-text'>
          {specialName && <p className='special-card__special-name'>{specialName}</p>}
          {comedianName && <p className='special-card__comedian-name'>{comedianName}</p>}
        </div>
        <FavoriteIcon category={'specials'} data={data} />
      </div>
    </Card>
  );
}

export default SpecialCard;
