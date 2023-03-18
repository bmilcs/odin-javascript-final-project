import { getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import Button from '@/components/Button/Button';
import useFetchPersonalAndSpecialsData from '@/hooks/useFetchPersonalAndSpecialsData';
import { BsCheckLg } from 'react-icons/bs';
import './AddComedianModal.scss';

function AddComedianModal({
  personId,
  handleAddComedian,
}: {
  personId: number;
  handleAddComedian: (personalId: number) => void;
}) {
  const { specials, appearances, personalData } = useFetchPersonalAndSpecialsData(personId);

  return (
    <div className='modal' onClick={(e) => e.stopPropagation()}>
      {personalData && (
        <div className='modal__personal'>
          {personalData.profile_path ? (
            <img
              src={getTMDBImageURL(personalData.profile_path)}
              alt={`${personalData.name} Headshot`}
              className='modal__image'
            />
          ) : (
            <MicrophoneSVG className='modal__image modal__svg' />
          )}

          <h4 className='modal__name'>{personalData.name}</h4>
        </div>
      )}

      {specials && appearances && personalData && personalData.name && specials.length !== 0 ? (
        // person has a special or appearance
        <>
          {specials.length > 0 && (
            <div className='modal__specials'>
              <h4>Specials</h4>
              <div className='modal__found'>
                <BsCheckLg size={14} className='specials__li__bullet' />
                <p>{specials.length} Specials Found!</p>
              </div>
            </div>
          )}
          {appearances.length > 0 && (
            <>
              <div className='modal__appearances'>
                <h4>Appearances</h4>
                <div className='modal__found'>
                  <BsCheckLg size={14} className='specials__li__bullet' />
                  <p>{appearances.length} Appearances Found!</p>
                </div>
              </div>
            </>
          )}

          <Button onClick={() => handleAddComedian(personalData.id)}>Add Comedian</Button>

          <p className='modal__warning'>
            If the person above is not a standup comedian,{' '}
            <span className='modal__warning__span'>please do not add them to the site.</span>
          </p>
        </>
      ) : (
        // person isn't a comedian
        <div className='modal__not-comedian'>
          <p className='modal__not-comedian__error'>No standup specials found.</p>
          <p>Sorry. We cannot add this person to the database at this time.</p>
        </div>
      )}
    </div>
  );
}

export default AddComedianModal;
