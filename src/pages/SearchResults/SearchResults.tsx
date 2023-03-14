import {
  getTMDBImageURL,
  IPersonSearchResult,
  IPersonSearchResultApiResponse,
  parseSearchQuery,
  searchForPersonURL,
} from '@/api/TMDB';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { allComedianIdsArr, allComediansDataArr, fetchAllComedians } from '@/app/store';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import AddComedianModal from '@/components/AddComedianModal/AddComedianModal';
import ComedianCard from '@/components/ComedianCard/ComedianCard';
import { IComedian } from '@/firebase/database';
import { addComedianToDB } from '@/firebase/functions';
import useFetch from '@/hooks/useFetch';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SearchResults.scss';

function SearchResults() {
  const { searchTerm } = useParams();
  const term = parseSearchQuery(searchTerm as string);
  const url = searchForPersonURL(term);
  const { data, isLoading, setUrl } = useFetch<IPersonSearchResultApiResponse>(url);
  const dispatch = useAppDispatch();
  const comedianIdsInDB = useAppSelector(allComedianIdsArr);
  const comediansInDb = useAppSelector(allComediansDataArr);
  const [missingComedians, setMissingComedians] = useState<IPersonSearchResult[]>([]);
  const [existingComedians, setExistingComedians] = useState<IComedian[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalPersonId, setModalPersonId] = useState<number>();
  const [addComedianPending, setAddComedianPending] = useState<boolean | null>(null);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  // once the comedian ids from the db are loaded & search results are fetched,
  // remove comedians that already exist
  useEffect(() => {
    if (!data || !comedianIdsInDB) return;

    const tmdbResults = [...data.results];

    const missingFromDB = tmdbResults.filter((person) => {
      return !comedianIdsInDB.includes(person.id);
    });

    const tmdbResultsThatExistInDB = tmdbResults.filter((person) => {
      return comedianIdsInDB.includes(person.id);
    });

    const existingButMissingFromTmdbResults = comediansInDb.filter((comedian) => {
      const isInTmdbResults = tmdbResultsThatExistInDB.some((person) => person.id === comedian.id);
      const partialNameMatch = comedian.name.toLowerCase().includes(term.toLowerCase());
      return !isInTmdbResults && partialNameMatch;
    });

    setMissingComedians(missingFromDB);
    setExistingComedians([
      ...tmdbResultsThatExistInDB,
      ...existingButMissingFromTmdbResults,
    ] as IComedian[]);
  }, [data, comedianIdsInDB]);

  const handleAddComedian = async (personalId: number) => {
    setAddComedianPending(true);
    setShowModal(false);

    addComedianToDB({ id: personalId })
      .then(() => {
        setAddComedianPending(false);
        dispatch(fetchAllComedians());
        navigate(`/comedians/${personalId}`);
      })
      .catch((error) => {
        setAddComedianPending(false);
        setShowError(true);
        console.log('error: unable to add comedian.');
        console.log(error.message);
      });
  };

  // update the results if the search term is changed while on the page
  useEffect(() => {
    const newUrl = searchForPersonURL(parseSearchQuery(term));
    setUrl(newUrl);
    setMissingComedians([]);
    setExistingComedians([]);
  }, [term]);

  return (
    <div className='column'>
      <div className='searchpage'>
        <div className='searchpage__header'>
          <h2 className='searchpage__title'>Comedian Search</h2>
          <p className='searchpage__details'>
            You searched for: <span className='searchpage__term'>{term}</span>
          </p>
        </div>
      </div>

      {isLoading && <p>Loading...</p>}

      {showError && (
        <p>
          Sorry. Something went wrong. Unable to add comedians at this time. Please contact us if
          the issue persists.
        </p>
      )}

      {/* display results of the search */}
      {!showError && !addComedianPending && (
        <>
          {existingComedians.length !== 0 && (
            <>
              <div className='result__header'>
                <h3 className='result__header__h3'>Existing Comedians</h3>
                <p className='result__header__p'>
                  The following comedians already exist in the database.
                </p>
              </div>
              <div className='searchpage__grid'>
                {/* TODO use firestore data. 
                    Convert IPersonSearchResult > IComedian
                */}
                {existingComedians.map((comedian) => (
                  <ComedianCard data={comedian} key={comedian.id} />
                ))}
              </div>
            </>
          )}

          {!showError && missingComedians.length !== 0 && (
            // allow the user to add new comedians to the site
            <>
              <div className='result__header'>
                <h3 className='result__header__h3'>Add New Comedians</h3>
                <p className='result__header__p'>
                  The following results are potential comedians that you can add to the site.
                </p>
              </div>
              <div className='searchpage__grid'>
                {missingComedians
                  // sort by popularity
                  .sort((a: IPersonSearchResult, b: IPersonSearchResult) => {
                    if (!a.popularity) return 1;
                    if (!b.popularity) return -1;
                    return a.popularity > b.popularity ? -1 : 1;
                  })
                  // create clickable cards each person
                  .map((person: IPersonSearchResult) => (
                    <div
                      className='searchpage__person'
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
                          className='searchpage__headshot'
                        />
                      ) : (
                        <MicrophoneSVG className='comedian-card__image comedian-card__svg' />
                      )}
                      <h3 className='searchpage__name'>{person.name}</h3>
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      )}

      {addComedianPending && <h4>Adding your comedian... Please wait!</h4>}

      {!showError && showModal && modalPersonId && (
        <div className='overlay' onClick={() => setShowModal(false)}>
          <AddComedianModal personId={modalPersonId} handleAddComedian={handleAddComedian} />
        </div>
      )}
    </div>
  );
}

export default SearchResults;
