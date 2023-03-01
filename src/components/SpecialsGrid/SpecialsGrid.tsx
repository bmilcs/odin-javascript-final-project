import { IComedySpecial } from '@/firebase/database';
import SpecialCard from '../SpecialCard/SpecialCard';
import './SpecialsGrid.scss';

type Props = {
  data: IComedySpecial[];
  title?: string;
};

function SpecialsGrid({ data, title = 'Specials' }: Props) {
  return (
    data && (
      <section className='specials'>
        <h3 className='specials__header'>{title}</h3>
        <div className='specials__grid'>
          {data.map((special: IComedySpecial) => (
            <SpecialCard data={special} key={special.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default SpecialsGrid;
