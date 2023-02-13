import { IDiscoverMovieResult } from "@/api/TMDB";
import SpecialCard from "@/components/SpecialCard/SpecialCard";
import "./AppearancesGrid.scss";

type Props = {
  data: IDiscoverMovieResult[];
};

function AppearancesGrid({ data }: Props) {
  return (
    data && (
      <section className="appearances">
        <h3 className="appearances__header">Appearances & Credits</h3>
        <div className="appearances__grid">
          {data.map((appearance: IDiscoverMovieResult) => (
            <SpecialCard {...appearance} key={appearance.id} />
          ))}
        </div>
      </section>
    )
  );
}

export default AppearancesGrid;
