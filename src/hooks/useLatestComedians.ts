import { IComedian, getLatestComediansFromDB } from '@/firebase/database';
import { useEffect, useState } from 'react';

const useLatestComedians = (): IComedian[] => {
  const [latestComedians, setLatestComedians] = useState<IComedian[]>([]);

  useEffect(() => {
    const getLatestComedians = async () => {
      const latestComedians = await getLatestComediansFromDB();
      if (!latestComedians) return;

      const sortedLatest = Object.keys(latestComedians)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aDate = latestComedians[a].dateAdded.seconds;
          const bDate = latestComedians[b].dateAdded.seconds;
          return aDate > bDate ? -1 : 1;
        })
        .map((specialId) => {
          return latestComedians[specialId];
        });

      setLatestComedians(sortedLatest);
    };

    getLatestComedians();
  }, []);

  return latestComedians;
};

export default useLatestComedians;
