import { ISpecial, getTopFavoriteSpecialsFromDB } from '@/firebase/database';
import { useEffect, useState } from 'react';

const useTopFavoriteSpecials = (): ISpecial[] => {
  const [topFavoriteSpecials, setTopFavoriteSpecials] = useState<ISpecial[]>([]);

  // on first page load...
  useEffect(() => {
    const getTopFavoriteSpecials = async () => {
      const specials = await getTopFavoriteSpecialsFromDB();
      if (!specials) return;
      const topFavoriteSpecials = Object.keys(specials)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aFavorites = specials[a].favorites;
          const bFavorites = specials[b].favorites;
          return aFavorites > bFavorites ? -1 : 1;
        })
        .map((specialId) => {
          return specials[specialId];
        });
      setTopFavoriteSpecials(topFavoriteSpecials);
    };

    getTopFavoriteSpecials();
  }, []);

  return topFavoriteSpecials;
};

export default useTopFavoriteSpecials;
