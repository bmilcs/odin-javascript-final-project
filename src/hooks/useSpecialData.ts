import {
  ISpecialPageComedianData,
  ISpecialPageData,
  ISpecialPageOtherContent,
  getSpecialOrAppearancePageFromDB,
} from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';

const useSpecialData = (specialId: number) => {
  const [special, setSpecial] = useState<ISpecialPageData | null>(null);
  const [otherContent, setOtherContent] = useState<ISpecialPageOtherContent[] | null>(null);
  const [comedian, setComedian] = useState<ISpecialPageComedianData | null>(null);

  useEffect(() => {
    const getSpecialPageDataFromDB = async () => {
      const pageRawData = await getSpecialOrAppearancePageFromDB(Number(specialId));

      if (pageRawData) {
        setSpecial(pageRawData.data);
        setComedian(pageRawData.comedian);

        if (pageRawData.otherContent.length > 0) {
          pageRawData.otherContent.sort((a, b) => {
            return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
          });

          setOtherContent(pageRawData.otherContent);
        }
      }
    };

    getSpecialPageDataFromDB();
  }, [specialId]);

  return { comedian, special, otherContent };
};

export default useSpecialData;
