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

function Header() {
  const isSignedIn = useAppSelector(isUserSignedIn);

  return (
    <header className="header">
      <div className="column">
        <Link to="/">
          <div className="title">
            <GiMicrophone size={30} className="title__icon" />
            <h1 className="title__text">the comedy db</h1>
          </div>
        </Link>

        {/* <form className="search">
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder="tom segura ball hog"
            minLength={4}
            maxLength={64}
          />

          <Button type="icon">
            <MdSearch size={20} />
          </Button>
        </form> */}

        <NavBar />

        {isSignedIn && (
          <Button type="outline" onClick={() => signUserOutFromFirebase()}>
            logout
          </Button>
        )}

        {!isSignedIn && (
          <Button onClick={() => signUserInWithGooglePopup()}>login</Button>
        )}
      </div>
    </header>
  );
}

export default Header;
