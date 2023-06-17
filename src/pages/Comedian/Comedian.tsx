import { getIMDBPersonURL, getTMDBImageURL } from '@/api/TMDB';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import MissingImg from '@/components/MissingImg/MissingImg';
import PageTransition from '@/components/PageTransition/PageTransition';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import useComedianData from '@/hooks/useComedianData';
import { formatDateNumberOfYearsPassed } from '@/utils/date';
import { FaImdb } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import './Comedian.scss';

function Comedian() {
  const { personId } = useParams();
  const { comedian, specials, appearances } = useComedianData(Number(personId));

  return (
    <PageTransition>
      <>
        <section className='comedian column'>
          {comedian && (
            <>
              {comedian.profile_path ? (
                <img
                  className='comedian__headshot'
                  src={getTMDBImageURL(comedian.profile_path)}
                  alt={`${comedian.name} Headshot`}
                />
              ) : (
                <MissingImg className='comedian__headshot' alt={`${comedian.name} Headshot`} />
              )}

              <div className='comedian__details'>
                <h2 className='comedian__name'>{comedian.name}</h2>

                {comedian.birthday && (
                  <>
                    <p className='comedian__birthday'>Born: {comedian.birthday}</p>
                    <p>{formatDateNumberOfYearsPassed(comedian.birthday)} Years Old</p>
                  </>
                )}

                {comedian.biography ? (
                  <p className='comedian__biography'>{comedian.biography}</p>
                ) : (
                  <p className='comedian__biography'>
                    Unfortunately, {comedian.name} is missing a biography. Show them some love by
                    visiting their themoviedb.org page and write one for them!
                  </p>
                )}

                <div className='comedian__icons'>
                  <FavoriteIcon data={comedian} category='comedians' />
                  {comedian.imdb_id && (
                    <a href={getIMDBPersonURL(+comedian.imdb_id)} target='_blank' rel='noreferrer'>
                      <FaImdb size={26} />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {specials && specials.length > 0 && <SpecialsGrid data={specials} title='Specials' />}

        {appearances && appearances.length > 0 && (
          <SpecialsGrid data={appearances} title='Appearances' />
        )}
      </>
    </PageTransition>
  );
}

export default Comedian;
