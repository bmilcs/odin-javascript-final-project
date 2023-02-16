import {
  getTMDBImageURL,
  parseSearchQuery,
  searchForPersonURL,
} from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import Button from "@/components/Button/Button";
import useFetch from "@/hooks/useFetch";
import { useEffect, useState } from "react";
import { MdSearch } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import "./SearchBar.scss";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data, error, isLoading, setUrl } = useFetch("");
  const navigate = useNavigate();

  // fired on input value changes
  useEffect(() => {
    // autocomplete drop down menu: call api after user stops typing
    const delayAutocomplete = setTimeout(() => {
      const term = parseSearchQuery(searchTerm);
      const url = searchForPersonURL(term);
      setUrl(url);
    }, 1000);

    return () => clearTimeout(delayAutocomplete);
  }, [searchTerm]);

  // display autocomplete results
  useEffect(() => {
    if (data && data.results) {
      setDropdownVisible(true);
      console.log(data.results);
    }
  }, [data]);

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    if (!searchTerm) return;

    const term = parseSearchQuery(searchTerm);
    navigate(`/search/${term}`);
  };

  return (
    <div className="search">
      <form className="search__form" onSubmit={(e) => handleSearchSubmit(e)}>
        <input
          type="text"
          id="search-input"
          className="search-input"
          placeholder="tom segura ball hog"
          autoComplete="off"
          minLength={4}
          maxLength={64}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDropdownVisible(false);
          }}
        />

        <Button type="icon">
          <MdSearch size={20} />
        </Button>
      </form>

      {dropdownVisible && data && data.results && data.length !== 0 && (
        <div className="dropdown">
          {data.results
            .sort((a, b) => {
              // sort by popularity
              return a.popularity > b.popularity ? -1 : 1;
            })
            .map((person) => {
              return (
                <div className="result" key={person.id}>
                  <Link to={`/comedians/${person.id}`}>
                    {person.profile_path ? (
                      <img
                        src={getTMDBImageURL(person.profile_path)}
                        alt={`${person.name} Headshot`}
                        className="result__photo"
                      />
                    ) : (
                      <MicrophoneSVG className="result__photo result__svg" />
                    )}
                  </Link>{" "}
                  {person.name && <p className="result__name">{person.name}</p>}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
