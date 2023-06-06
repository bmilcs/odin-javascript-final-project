import { IComedian, getTopFavoriteComediansFromDB } from '@/firebase/database';
import { useEffect, useState } from 'react';

const useTopFavoriteComedians = (): IComedian[] => {
  const [topFavoriteComedians, setTopFavoriteComedians] = useState<IComedian[]>([]);

  useEffect(() => {
    const getTopFavoriteComedians = async () => {
      const comedians = await getTopFavoriteComediansFromDB();
      if (!comedians) return;
      const topFavoriteComedians = Object.keys(comedians)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aFavorites = comedians[a].favorites;
          const bFavorites = comedians[b].favorites;
          return aFavorites > bFavorites ? -1 : 1;
        })
        .map((specialId) => {
          return comedians[specialId];
        });
      setTopFavoriteComedians(topFavoriteComedians);
    };

    getTopFavoriteComedians();
  }, []);

  return topFavoriteComedians;
};

export default useTopFavoriteComedians;
