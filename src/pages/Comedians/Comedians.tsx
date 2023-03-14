import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { allComediansDataArr, fetchAllComedians } from '@/app/store';
import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import { IComedian } from '@/firebase/database';
import { useEffect, useState } from 'react';
import './Comedians.scss';

function Comedians() {
  const dispatch = useAppDispatch();
  const allComediansData = useAppSelector(allComediansDataArr);
  const [alphabetizedComedians, setAlphabetizedComedians] = useState<IComedian[]>([]);

  useEffect(() => {
    if (allComediansData.length === 0) {
      dispatch(fetchAllComedians());
      return;
    }

    const comediansCopy = [...allComediansData];
    comediansCopy.sort((a, b) => (a.name > b.name ? 1 : -1));
    setAlphabetizedComedians(comediansCopy);
  }, [allComediansData]);

  return (
    <div className='column'>
      {alphabetizedComedians.length !== 0 && <ComedianGrid data={alphabetizedComedians} />}
    </div>
  );
}

export default Comedians;
