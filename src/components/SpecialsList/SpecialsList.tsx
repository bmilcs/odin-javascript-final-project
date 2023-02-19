import { getTMDBImageURL, IDiscoverMovieResult } from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import { formatDateYearOnly } from "@/utils/date";
import { BsCheckLg } from "react-icons/bs";
import "./SpecialsList.scss";

// function SpecialsList(data: any) {
function SpecialsList({ data }: { data: IDiscoverMovieResult[] }) {
  return (
    <ul className="specials__ul">
      {data.map((special) => {
        return (
          <li className="specials__li" key={special.id}>
            {special.release_date && special.title && (
              <>
                <BsCheckLg size={14} className="specials__li__bullet" />
                {special.title} ({formatDateYearOnly(special.release_date)})
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default SpecialsList;
