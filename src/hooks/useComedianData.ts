import {
  IComedianPagePersonalData,
  IComedianPageSpecialOrAppearance,
  getComedianPageFromDB,
} from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useComedianData = (comedianId: number) => {
  const [comedian, setComedian] = useState<IComedianPagePersonalData>();
  const [specials, setSpecials] = useState<IComedianPageSpecialOrAppearance[]>();
  const [appearances, setAppearances] = useState<IComedianPageSpecialOrAppearance[]>();

  useEffect(() => {
    const getDataFromDB = async () => {
      const pageRawData = await getComedianPageFromDB(Number(comedianId));
      if (!pageRawData) return;

      const personalData = pageRawData.personalData;

      const specialsArray = pageRawData.specials.sort((a, b) => {
        return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
      });

      const appearancesArray = pageRawData.appearances.sort((a, b) => {
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
