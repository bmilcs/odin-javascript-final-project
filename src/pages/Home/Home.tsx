import ComedianCard from "@/components/ComedianCard/ComedianCard";
import { COMEDIAN_DATA } from "@/data/comedians";
import "./Home.scss";

function Home() {
  return (
    <div className="column">
      <section className="comedian__list">
        {COMEDIAN_DATA.map((comedian) => {
          return <ComedianCard id={comedian.id} key={comedian.id} />;
        })}
      </section>
    </div>
  );
}

export default Home;
