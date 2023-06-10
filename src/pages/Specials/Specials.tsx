import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { allSpecialsDataArr, fetchAllSpecials } from '@/app/store';
import PageTransition from '@/components/PageTransition/PageTransition';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import { ISpecial } from '@/firebase/database';
import useTopFavoriteSpecials from '@/hooks/useTopFavoriteSpecials';
import useUpcomingSpecials from '@/hooks/useUpcomingSpecials';
import { useEffect, useState } from 'react';
import './Specials.scss';

function Specials() {
  const dispatch = useAppDispatch();
  const allSpecials = useAppSelector(allSpecialsDataArr);
  const [sortedSpecials, setSortedSpecials] = useState<ISpecial[]>([]);
  const upcomingSpecials = useUpcomingSpecials();
  const topFavoriteSpecials = useTopFavoriteSpecials();

  useEffect(() => {
    if (!allSpecials || allSpecials.length === 0) {
      dispatch(fetchAllSpecials());
      return;
    }

    const specialsCopy = [...allSpecials];
    specialsCopy.sort((a, b) => (a.title > b.title ? 1 : -1));
    setSortedSpecials(specialsCopy);
  }, [allSpecials]);

  return (
    <PageTransition>
      <>
        {upcomingSpecials && upcomingSpecials.length !== 0 && (
          <SpecialsGrid title='Coming Soon' data={upcomingSpecials} />
        )}

        {topFavoriteSpecials && topFavoriteSpecials.length !== 0 && (
          <SpecialsGrid title='Most Popular Specials' data={topFavoriteSpecials} />
        )}

        {sortedSpecials && sortedSpecials.length !== 0 && (
          <SpecialsGrid title='All Specials' data={sortedSpecials} />
        )}
      </>
    </PageTransition>
  );
}

export default Specials;
