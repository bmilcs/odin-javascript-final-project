import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import Hero from '@/components/Hero/Hero';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import {
  IComedian,
  ISpecial,
  getLatestComediansFromDB,
  getLatestSpecialsFromDB,
  getTopFavoriteComediansFromDB,
  getTopFavoriteSpecialsFromDB,
  getUpcomingSpecialsFromDB,
} from '@/firebase/database';
import { isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';
import './Home.scss';

function Home() {
  const [latestSpecials, setLatestSpecials] = useState<ISpecial[]>([]);
  const [upcomingSpecials, setUpcomingSpecials] = useState<ISpecial[]>([]);
  const [topFavoriteSpecials, setTopFavoriteSpecials] = useState<ISpecial[]>([]);
  const [latestComedians, setLatestComedians] = useState<IComedian[]>([]);
  const [topFavoriteComedians, setTopFavoriteComedians] = useState<IComedian[]>([]);

  // on first page load...
  useEffect(() => {
    const getLatestSpecials = async () => {
      const latestData = await getLatestSpecialsFromDB();
      if (!latestData) return;
      const sortedLatest = Object.keys(latestData)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aDate = latestData[a].release_date;
          const bDate = latestData[b].release_date;
          return isDateOneBeforeDateTwo(aDate, bDate) ? 1 : -1;
        })
        .map((specialId) => {
          return latestData[specialId];
        });
      setLatestSpecials(sortedLatest);
    };

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

    const getLatestComedians = async () => {
      const latestComedians = await getLatestComediansFromDB();
      if (!latestComedians) return;
      const sortedLatest = Object.keys(latestComedians)
        .map((string) => Number(string))
        .sort((a, b) => {
          const aDate = latestComedians[a].dateAdded.seconds;
          const bDate = latestComedians[b].dateAdded.seconds;
          return aDate > bDate ? -1 : 1;
        })
        .map((specialId) => {
          return latestComedians[specialId];
        });
      setLatestComedians(sortedLatest);
    };

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

    getTopFavoriteComedians();
    getTopFavoriteSpecials();
    getLatestComedians();
    getLatestSpecials();
    getUpcomingSpecials();
  }, []);

  return (
    <div className='column'>
      <Hero />

      {latestSpecials && latestSpecials.length !== 0 && (
        <SpecialsGrid title='Latest Releases' data={latestSpecials} />
      )}

      {topFavoriteComedians && topFavoriteComedians.length !== 0 && (
        <ComedianGrid title='Most Popular Comedians' data={topFavoriteComedians} />
      )}

      {upcomingSpecials && upcomingSpecials.length !== 0 && (
        <SpecialsGrid title='Coming Soon' data={upcomingSpecials} />
      )}

      {topFavoriteSpecials && topFavoriteSpecials.length !== 0 && (
        <SpecialsGrid title='Most Popular Specials' data={topFavoriteSpecials} />
      )}

      {latestComedians && latestComedians.length !== 0 && (
        <ComedianGrid title='Recently Added Comedians' data={latestComedians} />
      )}
    </div>
  );
}

export default Home;
