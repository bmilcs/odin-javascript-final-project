import ComedianGrid from '@/components/ComedianGrid/ComedianGrid';
import Hero from '@/components/Hero/Hero';
import PageTransition from '@/components/PageTransition/PageTransition';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import useLatestSpecials from '@/hooks/useLatestSpecials';
import useTopFavoriteComedians from '@/hooks/useTopFavoriteComedians';
import './Home.scss';

function Home() {
  const latestSpecials = useLatestSpecials();
  const topFavoriteComedians = useTopFavoriteComedians();

  return (
    <PageTransition>
      <>
        <Hero />

        {latestSpecials && latestSpecials.length !== 0 && (
          <SpecialsGrid title='Latest Standup Specials' data={latestSpecials} />
        )}

        {topFavoriteComedians && topFavoriteComedians.length !== 0 && (
          <ComedianGrid title='Most Popular Comedians' data={topFavoriteComedians} />
        )}
      </>
    </PageTransition>
  );
}

export default Home;
