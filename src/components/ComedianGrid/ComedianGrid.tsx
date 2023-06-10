import ComedianCard from '@/components/ComedianCard/ComedianCard';
import RevealChildren from '@/components/RevealChildren/RevealChildren';
import { IComedian } from '@/firebase/database';
import './ComedianGrid.scss';

type Props = {
  data: IComedian[];
  title?: string;
};

function ComedianGrid({ data, title }: Props) {
  return (
    data && (
      <section className='comedians column'>
        {title && (
          <RevealChildren>
            <h3 className='comedians__header'>{title}</h3>
          </RevealChildren>
        )}
        <div className='comedians__grid'>
          {data.map((comedian: IComedian) => (
            <RevealChildren key={comedian.id}>
              <ComedianCard data={comedian} />
            </RevealChildren>
          ))}
        </div>
      </section>
    )
  );
}

export default ComedianGrid;
