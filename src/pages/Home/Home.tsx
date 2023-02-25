import ComedianCard from "@/components/ComedianCard/ComedianCard";
import { COMEDIAN_DATA } from "@/data/comedians";
import "./Home.scss";
import {
  IComedySpecial,
  getLatestSpecialsFromDB,
  getUpcomingSpecialsFromDB,
} from "@/firebase/database";
import { useEffect, useState } from "react";
import SpecialsGrid from "@/components/SpecialsGrid/SpecialsGrid";

function Home() {
  const [latestSpecials, setLatestSpecials] = useState<IComedySpecial[]>([]);
  const [upcomingSpecials, setUpcomingSpecials] = useState<IComedySpecial[]>(
    []
  );

  useEffect(() => {
    const getLatest = async () => {
      const latestData = await getLatestSpecialsFromDB();
      if (!latestData) return;

      let latest: IComedySpecial[] = [];

      for (const special in latestData) {
        latest.push(latestData[special]);
      }

      setLatestSpecials(latest);
    };

    const getUpcoming = async () => {
      const upcomingData = await getUpcomingSpecialsFromDB();
      if (!upcomingData) return;

      let upcoming: IComedySpecial[] = [];

      for (const special in upcomingData) {
        upcoming.push(upcomingData[special]);
      }

      setUpcomingSpecials(upcoming);
    };

    getLatest();
    getUpcoming();
  }, []);

  return (
    <div className="column">
      {latestSpecials && (
        <SpecialsGrid title="Latest Releases" data={latestSpecials} />
      )}

      {upcomingSpecials && (
        <SpecialsGrid title="Coming Soon" data={upcomingSpecials} />
      )}

      {/*       
        latestSpecials.map((special) => {
           return <SpecialCard id={special.id} />;
         })} */}
      {/* <section className="comedian__list">
        {COMEDIAN_DATA.map((comedian) => {
          return <ComedianCard id={comedian.id} key={comedian.id} />;
        })}
      </section> */}
    </div>
  );
}

export default Home;
