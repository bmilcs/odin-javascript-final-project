import RevealChildren from '@/components/RevealChildren/RevealChildren';
import { IReleaseCard } from '@/firebase/database';
import SpecialCard from '../SpecialCard/SpecialCard';
import './SpecialsGrid.scss';

type Props = {
  data: IReleaseCard[];
  title?: string;
};

function SpecialsGrid({ data, title }: Props) {
  return (
    data && (
      <section className='specials column'>
        {title && (
          <RevealChildren>
            <h3 className='specials__header'>{title}</h3>
          </RevealChildren>
        )}
        <div className='specials__grid'>
          {data.map((special) => (
            <RevealChildren key={special.id}>
              <SpecialCard data={special} />
            </RevealChildren>
          ))}
        </div>
      </section>
    )
  );
}

export default SpecialsGrid;
