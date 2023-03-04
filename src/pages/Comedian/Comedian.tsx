import { getIMDBPersonURL, getTMDBImageURL } from '@/api/TMDB';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import {
  IComedianPagePersonalData,
  IComedianPageSpecialOrAppearance,
  getComedianPageFromDB,
} from '@/firebase/database';
import { formatDateNumberOfYearsPassed, isDateOneBeforeDateTwo } from '@/utils/date';
import { useEffect, useState } from 'react';
import { FaImdb } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import './Comedian.scss';

function Comedian() {
  const { personId } = useParams();
  const [personalData, setPersonalData] = useState<IComedianPagePersonalData>();
  const [specials, setSpecials] = useState<IComedianPageSpecialOrAppearance[]>();
  const [appearances, setAppearances] = useState<IComedianPageSpecialOrAppearance[]>();

  useEffect(() => {
    const getDataFromDB = async () => {
      const pageRawData = await getComedianPageFromDB(Number(personId));
      if (!pageRawData) return;
      const personalData = pageRawData.personalData;
      const specials = Object.keys(pageRawData.specials)
        .map((specialId) => {
          return pageRawData.specials[specialId];
        })
        .sort((a, b) => {
          return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
        });
      const appearances = Object.keys(pageRawData.appearances)
        .map((appearanceId) => {
          return pageRawData.appearances[appearanceId];
        })
        .sort((a, b) => {
          return isDateOneBeforeDateTwo(a.release_date, b.release_date) ? 1 : -1;
        });

      setPersonalData(personalData);
      if (specials) setSpecials(specials);
      if (appearances) setAppearances(appearances);
    };
    getDataFromDB();
  }, [personId]);

  return (
    <div className='column'>
      <div className='comedian'>
        {personalData && (
          <>
            {personalData.profile_path ? (
              <img
                className='comedian__headshot'
                src={getTMDBImageURL(personalData.profile_path)}
                alt=''
              ></img>
            ) : (
              <MicrophoneSVG className='comedian__headshot comedian__svg' />
            )}
            <div className='comedian__details'>
              <h2 className='comedian__name'>{personalData.name}</h2>
              {personalData.birthday && (
                <>
                  <p className='comedian__birthday'>Born: {personalData.birthday}</p>
                  <p>{formatDateNumberOfYearsPassed(personalData.birthday)} Years Old</p>
                </>
              )}
              {personalData.biography ? (
                <p className='comedian__biography'>{personalData.biography}</p>
              ) : (
                <p className='comedian__biography'>
                  Unfortunately, {personalData.name} is missing a biography. Show them some love by
                  visiting their themoviedb.org page and write one for them!
                </p>
              )}
              {personalData.imdb_id && (
                <p className='comedian__imdb'>
                  <a href={getIMDBPersonURL(personalData.imdb_id)}>
                    <FaImdb size={28} />
                  </a>
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {specials && specials.length > 0 && <SpecialsGrid data={specials} />}

      {appearances && appearances.length > 0 && (
        <SpecialsGrid data={appearances} title='Appearances' />
      )}
    </div>
  );
}

export default Comedian;
