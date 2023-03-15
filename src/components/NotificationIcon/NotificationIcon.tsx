import { getTMDBImageURL } from '@/api/TMDB';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { INotification, removeUserNotification } from '@/app/store';
import MicrophoneSVG from '@/assets/MicrophoneSVG';
import Button from '@/components/Button/Button';
import useOnClickOutside from '@/hooks/useClickOutside';
import { useEffect, useRef, useState } from 'react';
import { MdNotificationsActive, MdNotificationsNone } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import './NotificationIcon.scss';

function NotificationIcon() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.user.notifications);

  const [hasNotifications, setHasNotifications] = useState(true);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(windowRef, () => setIsWindowOpen(false));

  useEffect(() => {
    if (notifications.length === 0) setHasNotifications(false);
    else setHasNotifications(true);
  }, [notifications]);

  const handleNotificationIconClick = () => {
    setIsWindowOpen(!isWindowOpen);
  };

  // when the user submits the search form: enter / click icon
  const handleSpecialClick = (specialId: number) => {
    navigate(`/specials/${specialId}`);
    setIsWindowOpen(false);
    dispatch(removeUserNotification(specialId));
  };

  return (
    <div className='notifications' ref={windowRef}>
      {hasNotifications ? (
        <>
          <Button type='icon' onClick={() => handleNotificationIconClick()}>
            <MdNotificationsActive size={26} className='notification__icon-active' />
          </Button>
        </>
      ) : (
        <Button type='icon' onClick={() => handleNotificationIconClick()}>
          <MdNotificationsNone size={26} />
        </Button>
      )}
      {isWindowOpen && (
        <div className='notifications__window'>
          <h5>{hasNotifications ? 'New Specials Available!' : 'No Notifications At This Time'}</h5>
          <ul className='notifications__ul'>
            {notifications.map((notification: INotification) => {
              return (
                <li
                  className='notifications__li'
                  key={notification.data.id}
                  onClick={() => handleSpecialClick(notification.data.id)}
                >
                  {notification.data.backdrop_path ? (
                    <img
                      className='notifications__img'
                      src={getTMDBImageURL(notification.data.backdrop_path)}
                      alt={notification.data.title}
                    />
                  ) : notification.data.poster_path ? (
                    <img
                      className='notifications__img'
                      src={getTMDBImageURL(notification.data.poster_path)}
                      alt={notification.data.title}
                    />
                  ) : (
                    <MicrophoneSVG />
                  )}
                  <p className='notifications__title'>{notification.data.title}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationIcon;
