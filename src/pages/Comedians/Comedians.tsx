import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { allComediansDataArr, fetchAllComedians } from '@/app/store';
import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import PageTransition from '@/components/PageTransition/PageTransition';
import { IComedian } from '@/firebase/database';
import useLatestComedians from '@/hooks/useLatestComedians';
import { useEffect, useState } from 'react';
import './Comedians.scss';

function Comedians() {
  const dispatch = useAppDispatch();
  const allComediansData = useAppSelector(allComediansDataArr);
  const [allComedians, setAllComedians] = useState<IComedian[]>([]);
  const latestComedians = useLatestComedians();

  useEffect(() => {
    if (allComediansData.length === 0) {
      dispatch(fetchAllComedians());
      return;
    }

    const comediansCopy = [...allComediansData];
    comediansCopy.sort((a, b) => (a.name > b.name ? 1 : -1));
    setAllComedians(comediansCopy);
  }, [allComediansData]);

  return (
    <PageTransition>
      <>
        {latestComedians && latestComedians.length !== 0 && (
          <ComedianGrid title='Recently Added Comedians' data={latestComedians} />
        )}

        {allComedians.length !== 0 && <ComedianGrid title='All Comedians' data={allComedians} />}
      </>
    </PageTransition>
  );
}

export default Comedians;
