import { getTMDBImageURL } from "@/api/TMDB";
import MicrophoneSVG from "@/assets/MicrophoneSVG";
import Button from "@/components/Button/Button";
import SpecialsList from "@/components/SpecialsList/SpecialsList";
import useFetchPersonalAndSpecialsData from "@/hooks/useFetchPersonalAndSpecialsData";
import "./AddComedianModal.scss";

function AddComedianModal({
  personId,
  handleAddComedian,
}: {
  personId: number;
  handleAddComedian: (personalId: number) => void;
}) {
  const { specials, appearances, personalData } =
    useFetchPersonalAndSpecialsData(personId);

  return (
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      {personalData && (
        <div className="modal__personal">
          {personalData.profile_path ? (
            <img
              src={getTMDBImageURL(personalData.profile_path)}
              alt={`${personalData.name} Headshot`}
              className="modal__image"
            />
          ) : (
            <MicrophoneSVG className="modal__image modal__svg" />
          )}

          <h4 className="modal__name">{personalData.name}</h4>
        </div>
      )}

      {specials &&
      appearances &&
      personalData &&
      personalData.name &&
      (appearances.length !== 0 || specials.length !== 0) ? (
        // person has a special or appearance
        <>
          {specials.length > 0 && (
            <>
              <h3>Specials</h3>
              <SpecialsList data={specials} />
            </>
          )}
          {appearances.length > 0 && (
            <>
              <h3>Appearances</h3>
              <SpecialsList data={appearances} />
            </>
          )}

          <Button onClick={() => handleAddComedian(personalData.id)}>
            Add Comedian
          </Button>

          <p className="modal__warning">
            If the person above is not a standup comedian,{" "}
            <span className="modal__warning__span">
              please do not add them to the site.
            </span>
          </p>
        </>
      ) : (
        // person isn't a comedian
        <div className="modal__not-comedian">
          <p className="modal__not-comedian__error">
            No standup specials found.
          </p>
          <p>Sorry. We're unable to add this person to the site.</p>
        </div>
      )}
    </div>
  );
}

export default AddComedianModal;
