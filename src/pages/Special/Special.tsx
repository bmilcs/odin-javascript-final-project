import { getTMDBImageURL } from '@/api/TMDB';
import FavoriteIcon from '@/components/FavoriteIcon/FavoriteIcon';
import MissingImg from '@/components/MissingImg/MissingImg';
import PageTransition from '@/components/PageTransition/PageTransition';
import SpecialsGrid from '@/components/SpecialsGrid/SpecialsGrid';
import useSpecialData from '@/hooks/useSpecialData';
import { formatDateNumberOfYearsPassed, isAFutureDate } from '@/utils/date';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Special.scss';

// TODO separate name (small) from special title (large)
// TODO handle specials that haven't been released yet
// TODO ^ red banner, add to coming soon section on homepage
// TODO Hide "Years Ago" if 0

function Special() {
  const { specialId } = useParams();
  const { comedian, special, otherSpecials, otherAppearances } = useSpecialData(Number(specialId));
  const [yearsAgo, setYearsAgo] = useState<number | null>(null);
  const [isNotReleasedYet, setIsNotReleasedYet] = useState<boolean | null>(null);

  useEffect(() => {
    if (!special) return;

    setYearsAgo(formatDateNumberOfYearsPassed(special.release_date));
    setIsNotReleasedYet(isAFutureDate(special.release_date));
  }, [special, isNotReleasedYet, yearsAgo]);

  return (
    <PageTransition>
      <>
        {special && (yearsAgo !== null || isNotReleasedYet !== null) && (
          <>
            <section className='special column'>
              <div className='special__data'>
                {special.title && <h2 className='special__title'>{special.title}</h2>}

                {isNotReleasedYet !== null && yearsAgo !== null && (
                  <>
                    <p className='special__release-date'>Released on {special.release_date}</p>
                    {isNotReleasedYet ? (
                      <p className='special__coming-soon'>Coming soon!</p>
                    ) : (
                      <p className='special__years-ago'>
                        {yearsAgo === 0
                          ? 'Less than a year old'
                          : `${yearsAgo} Year${yearsAgo > 1 ? 's' : ''} Old`}
                      </p>
                    )}
                  </>
                )}

                {special.runtime && <p className='special__runtime'>{special.runtime} minutes</p>}

                {special.status && special.status !== 'Released' && (
                  <p className='special__status'>{special.status}</p>
                )}

                {special.overview && <p className='special__overview'>{special.overview}</p>}

                {special.homepage && (
                  <a className='special__homepage' href={special.homepage}>
                    Watch It Now
                  </a>
                )}

                {special.id && <FavoriteIcon category='specials' data={special} />}

                {comedian?.name && comedian?.id && (
                  <div className='special__comedian'>
                    <img
                      className='special__comedian-portrait'
                      src={getTMDBImageURL(comedian.profile_path)}
                      alt={comedian.name}
                    />
                    <Link to={`/comedians/${comedian.id}`}>Performed by {comedian.name}</Link>
                  </div>
                )}
              </div>

              {special.poster_path ? (
                <img
                  className='special__image special__image-portrait'
                  src={getTMDBImageURL(special.poster_path)}
                  alt={`${special.title}`}
                />
              ) : special.backdrop_path ? (
                <img
                  className='special__image special__image-landscape'
                  src={getTMDBImageURL(special.backdrop_path)}
                  alt={`${special.title}`}
                />
              ) : (
                <MissingImg className='special__image' alt={`${special.title}`} />
              )}
            </section>
          </>
        )}

        {otherSpecials && comedian && (
          <SpecialsGrid title={`${comedian.name}'s Specials`} data={otherSpecials} />
        )}

        {otherAppearances && comedian && (
          <SpecialsGrid title={`${comedian.name}'s Appearances`} data={otherAppearances} />
        )}
      </>
    </PageTransition>
  );
}

export default Special;
