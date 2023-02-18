import {
  getTMDBImageURL,
  IPersonSearchResult,
  parseSearchQuery,
  searchForPersonURL,
} from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import useFetch from "@/hooks/useFetch";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "./SearchResults.scss";

function SearchResults() {
  const { searchTerm } = useParams();
  const term = parseSearchQuery(searchTerm!);
  const url = searchForPersonURL(term);
  const { data, isLoading, setUrl } = useFetch(url);

  // update the results if the search term is changed while on the page
  useEffect(() => {
    const newUrl = searchForPersonURL(term);
    setUrl(newUrl);
  }, [term]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div className="column">
      <div className="searchpage">
        <div className="searchpage__header">
          <div className="left-column">
            <h2 className="searchpage__title">Comedian Search</h2>
            <p className="searchpage__details">
              For: <span className="searchpage__term">" {term} "</span>
            </p>
          </div>
          <div className="right-column">
            <p>
              To add a comedian to the site, click on the person's image and
              click on the "Add Comedian" button.
            </p>
          </div>
        </div>

        {data && data.results && data.length !== 0 && (
          // when results are present:
          <div className="searchpage__grid">
            {data.results
              // sort by popularity
              .sort((a: IPersonSearchResult, b: IPersonSearchResult) => {
                return a.popularity > b.popularity ? -1 : 1;
              })
              // create clickable cards each person
              .map((person: IPersonSearchResult) => (
                <div className="searchpage__person" key={person.id}>
                  <Link to={`/comedians/${person.id}`}>
                    {person.profile_path ? (
                      <img
                        src={getTMDBImageURL(person.profile_path)}
                        alt={`${person.name} Headshot`}
                        className="searchpage__headshot"
                      />
                    ) : (
                      <MicrophoneSVG className="comedian-card__image comedian-card__svg" />
                    )}
                    <h3 className="searchpage__name">{person.name}</h3>
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;

// return (
//   <div
//     className="searchpage__result"
//     data-tmdb={person.id}
//     key={person.id}
//   >
//     {person.profile_path ? (
//       <img
//         src={getTMDBImageURL(person.profile_path)}
//         alt={`${person.name} Headshot`}
//         className="searchpage__photo"
//       />
//     ) : (
//       <MicrophoneSVG className="searchpage__photo searchpage__svg" />
//     )}
//     {person.name && (
//       <p className="searchpage__name">{person.name}</p>
//     )}
//   </div>
// );
// })
