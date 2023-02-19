import {
  getTMDBImageURL,
  IDiscoverMovieResult,
  IPersonDetailsResult,
  IPersonSearchResult,
  parseSearchQuery,
  searchForPersonURL,
} from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import AddComedianModal from "@/components/AddComedianModal/AddComedianModal";
import useFetch from "@/hooks/useFetch";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./SearchResults.scss";
import { addComedianToDB } from "@/firebase/database";

function SearchResults() {
  const { searchTerm } = useParams();
  const term = parseSearchQuery(searchTerm!);
  const url = searchForPersonURL(term);
  const { data, isLoading, setUrl } = useFetch(url);
  const [showModal, setShowModal] = useState(false);
  const [modalPersonId, setModalPersonId] = useState<number>();

  // update the results if the search term is changed while on the page
  useEffect(() => {
    const newUrl = searchForPersonURL(term);
    setUrl(newUrl);
  }, [term]);

  const handleAddComedian = (personalId: number) => {
    addComedianToDB(personalId);
  };

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  return (
    <div className="column">
      <div className="searchpage">
        <div className="searchpage__header">
          <h2 className="searchpage__title">Comedian Search</h2>
          <p className="searchpage__details">
            You searched for:{" "}
            <span className="searchpage__term">" {term} "</span>
          </p>
          {/* <p className="searchpage__instructions">
            To add a comedian to the site, click on the person's image and click
            on the "Add Comedian" button.
          </p> */}
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
              <div
                className="searchpage__person"
                key={person.id}
                onClick={() => {
                  setShowModal(true);
                  setModalPersonId(person.id);
                }}
              >
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
              </div>
            ))}
        </div>
      )}

      {showModal && modalPersonId && (
        <div className="overlay" onClick={(e) => setShowModal(false)}>
          <AddComedianModal
            personId={modalPersonId}
            handleAddComedian={handleAddComedian}
          />
        </div>
      )}
    </div>
  );
}

export default SearchResults;
