import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch } from "react-icons/md";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import Button from "@/components/Button/Button";
import useFetch from "@/hooks/useFetch";
import useOnClickOutside from "@/hooks/useClickOutside";
import "./SearchBar.scss";
import {
  getTMDBImageURL,
  IPersonSearchResult,
  parseSearchQuery,
  searchForPersonURL,
} from "@/api/TMDB";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data, isLoading, setUrl } = useFetch("");
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  // when the input value changes
  useEffect(() => {
    // wait for the user to stop typing & then make the api call
    // for the dropdown autocomplete options
    const delayAutocomplete = setTimeout(() => {
      if (!searchTerm || searchTerm.length < 3) return;
      const term = parseSearchQuery(searchTerm);
      const url = searchForPersonURL(term);
      setUrl(url);
    }, 1000);

    return () => clearTimeout(delayAutocomplete);
  }, [searchTerm]);

  // when fetch returns data for autocomplete
  useEffect(() => {
    if (data && data.results) {
      setDropdownVisible(true);
    }
  }, [data]);

  const clearHideDropDown = () => {
    setSearchTerm("");
    setDropdownVisible(false);
    setUrl("");
  };

  useOnClickOutside(searchRef, () => {
    setDropdownVisible(false);
  });

  // when the user submits the search form: enter / click icon
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm) return;

    const term = parseSearchQuery(searchTerm);
    navigate(`/search/${term}`);
    clearHideDropDown();
  };

  // when the user clicks on person in the autocomplete dropdown
  const handleMenuClick = (e: React.MouseEvent) => {
    const elem = e.target as HTMLDivElement;
    const tmdbId = elem.getAttribute("data-tmdb");
    if (!tmdbId) return;

    clearHideDropDown();
    navigate(`/comedians/${tmdbId}`);
  };

  return (
    <div className="search" ref={searchRef}>
      <form className="search__form" onSubmit={(e) => handleSearchSubmit(e)}>
        <input
          type="text"
          id="search-input"
          className="search-input"
          placeholder="Bill Burr"
          autoComplete="off"
          minLength={4}
          maxLength={64}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          value={searchTerm}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDropdownVisible(false);
          }}
        />

        <Button type="icon" className="search__button">
          <MdSearch size={24} />
        </Button>

        {dropdownVisible && isLoading && (
          <div className="dropdown">Loading...</div>
        )}

        {dropdownVisible && data && data.results && data.length !== 0 && (
          <div className="dropdown" onClick={(e) => handleMenuClick(e)}>
            {data.results
              // sort by popularity
              .sort((a: IPersonSearchResult, b: IPersonSearchResult) => {
                return a.popularity > b.popularity ? -1 : 1;
              })
              // limit to 10 results
              .slice(0, 10)
              // display tiny image & person's name
              .map((person: IPersonSearchResult) => {
                return (
                  <div className="result" data-tmdb={person.id} key={person.id}>
                    {person.profile_path ? (
                      <img
                        src={getTMDBImageURL(person.profile_path)}
                        alt={`${person.name} Headshot`}
                        className="result__photo"
                      />
                    ) : (
                      <MicrophoneSVG className="result__photo result__svg" />
                    )}
                    {person.name && (
                      <p className="result__name">{person.name}</p>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
