import { IComedianPageComedian, IReleaseCard, getComedianPageFromDB } from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useComedianData = (comedianId: number) => {
  const [comedian, setComedian] = useState<IComedianPageComedian>();
  const [specials, setSpecials] = useState<IReleaseCard[]>();
  const [appearances, setAppearances] = useState<IReleaseCard[]>();

  useEffect(() => {
    const getDataFromDB = async () => {
      const pageData = await getComedianPageFromDB(Number(comedianId));
      if (!pageData) return;

      const personalData = pageData.comedian;

      const specialsArray = pageData.specials.sort((a, b) => {
        return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
      });

      const appearancesArray = pageData.appearances.sort((a, b) => {
        return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
      });

      setComedian(personalData);
      if (specialsArray.length > 0) setSpecials(specialsArray);
      if (appearancesArray.length > 0) setAppearances(appearancesArray);
    };

    getDataFromDB();
  }, [comedianId]);

  return { comedian, specials, appearances };
};

export default useComedianData;
