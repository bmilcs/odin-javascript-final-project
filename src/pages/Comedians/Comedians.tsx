import { useAppSelector } from '@/app/hooks';
import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import { allComediansDataArr } from '@/features/allComediansSlice/allComediansSlice';
import { IComedian } from '@/firebase/database';
import { useEffect, useState } from 'react';
import './Comedians.scss';

function Comedians() {
  const allComedians = useAppSelector(allComediansDataArr);
  const [alphabetizedComedians, setAlphabetizedComedians] = useState<IComedian[]>([]);

  useEffect(() => {
    if (allComedians.length === 0) return;
    const comediansCopy = [...allComedians];
    comediansCopy.sort((a, b) => (a.name > b.name ? 1 : -1));
    setAlphabetizedComedians(comediansCopy);
  }, [allComedians]);

  return (
    <div className='column'>
      {alphabetizedComedians.length !== 0 && <ComedianGrid data={alphabetizedComedians} />}
    </div>
  );
}

export default Comedians;
