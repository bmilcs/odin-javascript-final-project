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
import {
  addComedianToDB,
  allComedians,
  getAllComedianIdsFromDB,
  getAllComediansFromDB,
} from "@/firebase/database";
import ComedianCard from "@/components/ComedianCard/ComedianCard";

function SearchResults() {
  const { searchTerm } = useParams();
  const term = parseSearchQuery(searchTerm!);
  const url = searchForPersonURL(term);
  const { data, isLoading, setUrl } = useFetch(url);
  const [comedianIdsInDb, setComedianIdsInDb] = useState<number[]>([]);
  const [missingComedians, setMissingComedians] = useState<
    IPersonSearchResult[]
  >([]);
  const [existingComedians, setExistingComedians] = useState<
    IPersonSearchResult[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [modalPersonId, setModalPersonId] = useState<number>();

  // on first page load, get list of all comedians currently on the site
  useEffect(() => {
    const getComedians = async () => {
      const comedianIds = await getAllComedianIdsFromDB();
      setComedianIdsInDb(comedianIds);
    };

    getComedians();
  }, []);

  // once the comedian ids from the db are loaded & search results are fetched,
  // remove comedians that already exist
  useEffect(() => {
    if (!data || comedianIdsInDb.length === 0) return;
    const results = [...data.results];

    const missing = results.filter((person) => {
      return !comedianIdsInDb.includes(person.id);
    });

    const existing = results.filter((person) => {
      return comedianIdsInDb.includes(person.id);
    });

    setMissingComedians(missing);
    setExistingComedians(existing);
  }, [data, comedianIdsInDb]);

  const handleAddComedian = (personalId: number) => {
    addComedianToDB(personalId);
  };

  // update the results if the search term is changed while on the page
  useEffect(() => {
    const newUrl = searchForPersonURL(term);
    setUrl(newUrl);
    setMissingComedians([]);
    setExistingComedians([]);
  }, [term]);

  return (
    <div className="column">
      <div className="searchpage">
        <div className="searchpage__header">
          <h2 className="searchpage__title">Comedian Search</h2>
          <p className="searchpage__details">
            You searched for:{" "}
            <span className="searchpage__term">" {term} "</span>
          </p>
        </div>
      </div>

      {existingComedians.length !== 0 && (
        <>
          <div className="result__header">
            <h3 className="result__header__h3">Existing Comedians</h3>
            <p className="result__header__p">
              The following comedians already exist in the database.
            </p>
          </div>
          <div className="searchpage__grid">
            {existingComedians.map((comedian) => (
              <ComedianCard id={comedian.id} />
            ))}
          </div>
        </>
      )}

      {missingComedians.length !== 0 && (
        // allow the user to add new comedians to the site
        <>
          <div className="result__header">
            <h3 className="result__header__h3">Add New Comedians</h3>
            <p className="result__header__p">
              The following results are potential comedians that you can add to
              the site.
            </p>
          </div>
          <div className="searchpage__grid">
            {missingComedians
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
        </>
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
