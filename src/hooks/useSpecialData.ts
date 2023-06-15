import {
  IReleaseCard,
  ISpecialPageComedian,
  ISpecialPageSpecial,
  getSpecialOrAppearancePageFromDB,
} from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useSpecialData = (specialId: number) => {
  const [special, setSpecial] = useState<ISpecialPageSpecial | null>(null);
  const [otherSpecials, setOtherSpecials] = useState<IReleaseCard[] | null>(null);
  const [otherAppearances, setOtherAppearances] = useState<IReleaseCard[] | null>(null);
  const [comedian, setComedian] = useState<ISpecialPageComedian | null>(null);

  useEffect(() => {
    const getSpecialPageDataFromDB = async () => {
      const pageRawData = await getSpecialOrAppearancePageFromDB(Number(specialId));
      if (!pageRawData) return;

      setSpecial(pageRawData.special);
      setComedian(pageRawData.comedian);

      if (pageRawData.otherSpecials.length > 0) {
        pageRawData.otherSpecials.sort((a, b) =>
          isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1,
        );
        setOtherSpecials(pageRawData.otherSpecials);
      }

      if (pageRawData.otherAppearances.length > 0) {
        pageRawData.otherAppearances.sort((a, b) =>
          isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1,
        );
        setOtherAppearances(pageRawData.otherAppearances);
      }
    };

    getSpecialPageDataFromDB();
  }, [specialId]);

  return { comedian, special, otherSpecials, otherAppearances };
};

export default useSpecialData;
