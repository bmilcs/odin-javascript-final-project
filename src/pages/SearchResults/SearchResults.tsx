import { useParams } from "react-router-dom";
import "./SearchResults.scss";

function SearchResults() {
  const { searchTerm } = useParams();

  return (
    <div className="column">
      <div className="results">
        <h2>Search Results</h2>
        <p>You searched for: {searchTerm}</p>
      </div>
    </div>
  );
}

export default SearchResults;
