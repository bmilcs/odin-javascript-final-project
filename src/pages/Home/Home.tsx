import { useEffect, useState } from "react";
import ComedianCard from "@/components/ComedianCard/ComedianCard";
import {
  IComedian,
  IComedySpecial,
  getLatestComediansFromDB,
  getLatestSpecialsFromDB,
  getUpcomingSpecialsFromDB,
} from "@/firebase/database";
import SpecialsGrid from "@/components/SpecialsGrid/SpecialsGrid";
import "./Home.scss";

function Home() {
  const [latestSpecials, setLatestSpecials] = useState<IComedySpecial[]>([]);
  const [latestComedians, setLatestComedians] = useState<IComedian[]>([]);
  const [upcomingSpecials, setUpcomingSpecials] = useState<IComedySpecial[]>(
    []
  );

  // on first page load, retrieve latest/upcoming specials & comedians
  useEffect(() => {
    const getLatestSpecials = async () => {
      const latestData = await getLatestSpecialsFromDB();
      if (!latestData) return;

      let latest: IComedySpecial[] = [];
      for (const special in latestData) {
        latest.push(latestData[special]);
      }
      setLatestSpecials(latest);
    };

    const getUpcomingSpecials = async () => {
      const upcomingData = await getUpcomingSpecialsFromDB();
      if (!upcomingData) return;

      let upcoming: IComedySpecial[] = [];
      for (const special in upcomingData) {
        upcoming.push(upcomingData[special]);
      }
      setUpcomingSpecials(upcoming);
    };

    const getLatestComedians = async () => {
      const latestComedians = await getLatestComediansFromDB();
      if (!latestComedians) return;

      let latest = [];
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
    <div className="column">
      {latestSpecials && (
        <SpecialsGrid title="Latest Releases" data={latestSpecials} />
      )}

      {upcomingSpecials && (
        <SpecialsGrid title="Coming Soon" data={upcomingSpecials} />
      )}

      {latestComedians &&
        latestComedians.map((comedian) => (
          <ComedianCard id={comedian.id} key={comedian.id} />
        ))}
    </div>
  );
}

export default Home;
