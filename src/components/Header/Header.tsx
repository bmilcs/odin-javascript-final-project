import { GiMicrophone } from "react-icons/gi";
import { MdSearch } from "react-icons/md";
import { Link } from "react-router-dom";
import {
  signUserInWithGooglePopup,
  signUserOutFromFirebase,
} from "@/firebase/authentication";
import { useAppSelector } from "@/app/hooks";
import { isUserSignedIn } from "@/features/userSlice/userSlice";
import Button from "@/components/Button/Button";
import NavBar from "@/components/NavBar/NavBar";
import "./Header.scss";
import SearchBar from "@/components/SearchBar/SearchBar";

function Header() {
  const isSignedIn = useAppSelector(isUserSignedIn);

  return (
    <header className="header">
      <div className="column">
        <Link to="/">
          <div className="title">
            {/* <GiMicrophone size={28} className="title__icon" /> */}
            <h1 className="title__text">
              comedy<span className="title__text__db">db</span>
            </h1>
          </div>
        </Link>

        <SearchBar />

        <NavBar />

        {isSignedIn ? (
          <Button type="outline" onClick={() => signUserOutFromFirebase()}>
            logout
          </Button>
        ) : (
          <Button onClick={() => signUserInWithGooglePopup()}>login</Button>
        )}
      </div>
    </header>
  );
}

export default Header;
