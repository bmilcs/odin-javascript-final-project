import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import Hero from '@/components/Hero/Hero';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import useLatestComedians from '@/hooks/useLatestComedians';
import useLatestSpecials from '@/hooks/useLatestSpecials';
import useTopFavoriteComedians from '@/hooks/useTopFavoriteComedians';
import useTopFavoriteSpecials from '@/hooks/useTopFavoriteSpecials';
import useUpcomingSpecials from '@/hooks/useUpcomingSpecials';
import './Home.scss';

function Home() {
  const latestSpecials = useLatestSpecials();
  const upcomingSpecials = useUpcomingSpecials();
  const latestComedians = useLatestComedians();
  const topFavoriteComedians = useTopFavoriteComedians();
  const topFavoriteSpecials = useTopFavoriteSpecials();

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
