import ComedianCard from "@/components/ComedianCard/ComedianCard";
import "./ComedianGrid.scss";
import { IComedian, IComedySpecial } from "@/firebase/database";

type Props = {
  data: IComedian[];
  title?: string;
};

function ComedianGrid({ data, title = "Comedians" }: Props) {
  return (
    data && (
      <section className="comedians">
        <h3 className="comedians__header">{title}</h3>
        <div className="comedians__grid">
          {data.map((comedian: IComedian) => (
            <ComedianCard data={comedian} key={comedian.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default ComedianGrid;
