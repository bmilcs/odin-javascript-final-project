import "./SpecialsGrid.scss";
import SpecialCard from "../SpecialCard/SpecialCard";
import { IComedySpecial } from "@/firebase/database";

type Props = {
  data: IComedySpecial[];
  title?: string;
};

function SpecialsGrid({ data, title = "Specials" }: Props) {
  return (
    data && (
      <section className="specials">
        <h3 className="specials__header">{title}</h3>
        <div className="specials__grid">
          {data.map((special: IComedySpecial) => (
            <SpecialCard {...special} key={special.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default SpecialsGrid;
