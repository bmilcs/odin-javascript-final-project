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
  const [mainImageOrientation, setMainImageOrientation] = useState<
    'landscape' | 'portrait' | 'missing'
  >();

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

  useEffect(() => {
    if (!special) return;

    if (special.backdrop_path) {
      setMainImageOrientation('landscape');
    } else if (special.poster_path) {
      setMainImageOrientation('portrait');
    } else {
      setMainImageOrientation('missing');
    }
  }, [special]);

  return { comedian, special, otherContent, mainImageOrientation };
};

export default useSpecialData;
