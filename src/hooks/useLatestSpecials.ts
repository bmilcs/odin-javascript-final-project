import { ISpecial, getLatestSpecialsFromDB } from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useLatestSpecials = (): ISpecial[] => {
  const [latestSpecials, setLatestSpecials] = useState<ISpecial[]>([]);

  useEffect(() => {
    const getLatestSpecials = async () => {
      const latestData = await getLatestSpecialsFromDB();
      if (!latestData) return;

      const sortedLatest = Object.keys(latestData)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aDate = latestData[a].release_date;
          const bDate = latestData[b].release_date;
          return isDateOneBeforeDateTwo(aDate, bDate) ? 1 : -1;
        })
        .map((specialId) => {
          return latestData[specialId];
        });

      setLatestSpecials(sortedLatest);
    };

    getLatestSpecials();
  }, []);

  return latestSpecials;
};

export default useLatestSpecials;
