import { IComedianPageSpecialOrAppearance } from '@/firebase/database';
import SpecialCard from '../SpecialCard/SpecialCard';
import './SpecialsGrid.scss';

type Props = {
  data: IComedianPageSpecialOrAppearance[];
  title?: string;
};

function SpecialsGrid({ data, title }: Props) {
  return (
    data && (
      <section className='specials'>
        {title && <h3 className='specials__header'>{title}</h3>}
        <div className='specials__grid'>
          {data.map((special) => (
            <SpecialCard data={special} key={special.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default SpecialsGrid;
