import { ISpecial, getUpcomingSpecialsFromDB } from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useUpcomingSpecials = (): ISpecial[] => {
  const [upcomingSpecials, setUpcomingSpecials] = useState<ISpecial[]>([]);

  useEffect(() => {
    const getUpcomingSpecials = async () => {
      const upcomingData = await getUpcomingSpecialsFromDB();
      if (!upcomingData) return;

      const sortedUpcoming = Object.keys(upcomingData)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aDate = upcomingData[a].release_date;
          const bDate = upcomingData[b].release_date;
          return isDateOneBeforeDateTwo(aDate, bDate) ? 1 : -1;
        })
        .map((specialId) => {
          return upcomingData[specialId];
        });

      setUpcomingSpecials(sortedUpcoming);
    };

    getUpcomingSpecials();
  }, []);

  return upcomingSpecials;
};

export default useUpcomingSpecials;
