import React from "react";
import { GiMicrophone } from "react-icons/gi";
import { MdSearch } from "react-icons/md";
import { Link } from "react-router-dom";
import Button from "../Button/Button";
import "./Header.scss";

function Header() {
  return (
    <header className="header">
      <div className="column">
        <Link to="/">
          <div className="title">
            <GiMicrophone size={30} className="title__icon" />
            <h1 className="title__text">the comedy db</h1>
          </div>
        </Link>

        <form className="search">
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder="tom segura ball hog"
            minLength={4}
            maxLength={64}
          />
          <Button type="icon">
            <MdSearch size={22} />
          </Button>
        </form>

        <Button>login</Button>
      </div>
    </header>
  );
}

export default Header;
