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

      const specials = Object.keys(pageRawData.specials)
        .map((specialId) => {
          return pageRawData.specials[specialId];
        })
        .sort((a, b) => {
          return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
        });

      const appearances = Object.keys(pageRawData.appearances)
        .map((appearanceId) => {
          return pageRawData.appearances[appearanceId];
        })
        .sort((a, b) => {
          return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
        });

      setComedian(personalData);
      if (specials) setSpecials(specials);
      if (appearances) setAppearances(appearances);
    };

    getDataFromDB();
  }, [comedianId]);

  return { comedian, specials, appearances };
};

export default useComedianData;
