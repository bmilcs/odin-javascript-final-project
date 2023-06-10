import ComedianCard from '@/components/ComedianCard/ComedianCard';
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
        {title && <h3 className='comedians__header'>{title}</h3>}
        <div className='comedians__grid'>
          {data.map((comedian: IComedian) => (
            <ComedianCard data={comedian} key={comedian.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default ComedianGrid;
