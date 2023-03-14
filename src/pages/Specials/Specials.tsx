import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { allSpecialsDataArr, fetchAllSpecials } from '@/app/store';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { ISpecial } from '@/firebase/database';
import { useEffect, useState } from 'react';
import './Specials.scss';

function Specials() {
  const dispatch = useAppDispatch();
  const allSpecials = useAppSelector(allSpecialsDataArr);
  const [sortedSpecials, setSortedSpecials] = useState<ISpecial[]>([]);

  useEffect(() => {
    if (!allSpecials || allSpecials.length === 0) dispatch(fetchAllSpecials());
  }, []);

  useEffect(() => {
    if (allSpecials.length === 0) return;
    const specialsCopy = [...allSpecials];
    specialsCopy.sort((a, b) => (a.title > b.title ? 1 : -1));
    setSortedSpecials(specialsCopy);
  }, [allSpecials]);

  return (
    <div className='column'>
      {sortedSpecials && sortedSpecials.length !== 0 && <SpecialsGrid data={sortedSpecials} />}
    </div>
  );
}

export default Specials;
