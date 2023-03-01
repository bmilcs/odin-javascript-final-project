import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import {
  IComedian,
  IComedySpecial,
  getLatestComediansFromDB,
  getLatestSpecialsFromDB,
  getUpcomingSpecialsFromDB,
} from '@/firebase/database';
import { useEffect, useState } from 'react';
import './Home.scss';

function Home() {
  const [latestSpecials, setLatestSpecials] = useState<IComedySpecial[]>([]);
  const [latestComedians, setLatestComedians] = useState<IComedian[]>([]);
  const [upcomingSpecials, setUpcomingSpecials] = useState<IComedySpecial[]>([]);

  // on first page load, retrieve latest/upcoming specials & comedians
  useEffect(() => {
    const getLatestSpecials = async () => {
      const latestData = await getLatestSpecialsFromDB();
      if (!latestData) return;

      const latest: IComedySpecial[] = [];
      for (const special in latestData) {
        latest.push(latestData[special]);
      }
      setLatestSpecials(latest);
    };

    const getUpcomingSpecials = async () => {
      const upcomingData = await getUpcomingSpecialsFromDB();
      if (!upcomingData) return;

      const upcoming: IComedySpecial[] = [];
      for (const special in upcomingData) {
        upcoming.push(upcomingData[special]);
      }
      setUpcomingSpecials(upcoming);
    };

    const getLatestComedians = async () => {
      const latestComedians = await getLatestComediansFromDB();
      if (!latestComedians) return;

      const latest = [];
      for (const comedian in latestComedians) {
        latest.push(latestComedians[comedian]);
      }
      setLatestComedians(latest);
    };

    getLatestComedians();
    getLatestSpecials();
    getUpcomingSpecials();
  }, []);

  return (
    <div className='column'>
      {latestSpecials && <SpecialsGrid title='Latest Releases' data={latestSpecials} />}

      {upcomingSpecials && <SpecialsGrid title='Coming Soon' data={upcomingSpecials} />}

      {latestComedians && <ComedianGrid data={latestComedians} title='Recently Added Comedians' />}
    </div>
  );
}

export default Home;
