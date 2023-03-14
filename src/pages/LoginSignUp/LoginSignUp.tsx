import { useAppSelector } from '@/app/hooks';
import { isUserSignedIn } from '@/app/store';
import GoogleImage from '@/assets/google-sign-in.png';
import Button from '@/components/Button/Button';
import {
  createEmailUser,
  signInEmailUser,
  signUserInWithGooglePopup,
} from '@/firebase/authentication';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignUp.scss';

type TProps = {
  initialView: 'login' | 'signup';
};

function LoginSignUp({ initialView }: TProps) {
  const navigate = useNavigate();
  const isUserLoggedIn = useAppSelector(isUserSignedIn);

  // if already logged in, move to user favorites page
  useEffect(() => {
    if (isUserLoggedIn) navigate('/favorites');
  }, [isUserLoggedIn]);

  const googlePopUp = () => {
    signUserInWithGooglePopup();
  };

  function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const isMatchingPasswords = () => {
      if (password.length < 8 || password2.length < 8) return;
      password !== password2 ? setErrorMessage('Mismatching passwords') : setErrorMessage('');
    };

    useEffect(() => {
      isMatchingPasswords();
    }, [password, password2]);

    const handleSignUpAttempt = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isMatchingPasswords) return;

      createEmailUser(email, password, name).catch((e) => {
        const errorCode = e.code;
        const message = errorCode.split('/')[1].replaceAll('-', ' ') || 'Unknown error';
        setErrorMessage(message);
      });
    };

    return (
      <div className='form__wrapper'>
        <form onSubmit={handleSignUpAttempt} className='authform'>
          <h3>Sign Up</h3>

          <div className='input'>
            <label htmlFor='email'>Name</label>
            <input
              type='string'
              id='name'
              placeholder='Joe Smith'
              required
              minLength={6}
              onChange={(e) => {
                setName(e.target.value);
              }}
              value={name}
            />
          </div>

          <div className='input'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              placeholder='abc@gmail.com'
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
          </div>

          <div className='input'>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              id='password'
              placeholder='*******'
              required
              minLength={8}
              maxLength={25}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              value={password}
            />
          </div>

          <div className='input'>
            <label htmlFor='password2'>Password</label>
            <input
              type='password'
              id='password2'
              placeholder='*******'
              required
              minLength={8}
              maxLength={25}
              onChange={(e) => {
                setPassword2(e.target.value);
              }}
              value={password2}
            />
          </div>

          {errorMessage && <span className='error'>{errorMessage}</span>}

          <Button>Sign Up</Button>

          <a className='swap__link' href='/login'>
            Already signed up? Login here.
          </a>
        </form>

        <Button type='icon' onClick={() => googlePopUp()}>
          <img src={GoogleImage} alt='Google Login' />
        </Button>
      </div>
    );
  }

  function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLoginAttempt = async (e: React.FormEvent) => {
      e.preventDefault();

      signInEmailUser(email, password).catch((e) => {
        const errorCode = e.code;
        console.log(errorCode);
        const message = errorCode.split('/')[1].replaceAll('-', ' ') || 'Unknown error';
        setErrorMessage(message);
      });
    };

    return (
      <div className='form__wrapper'>
        <form onSubmit={handleLoginAttempt} className='authform'>
          <h3>Login</h3>
          <div className='input'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              placeholder='abc@gmail.com'
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>

          <div className='input'>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              id='password'
              placeholder='*******'
              required
              minLength={8}
              maxLength={25}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>

          <Button>Login</Button>

          {errorMessage && <span className='error'>{errorMessage}</span>}

          <a className='swap__link' href='/signup'>
            Need an account? Sign up here.
          </a>
        </form>

        <Button type='icon' onClick={() => googlePopUp()}>
          <img src={GoogleImage} alt='Google Login' />
        </Button>
      </div>
    );
  }

  return (
    <div className='column__fullheight'>{initialView === 'login' ? <Login /> : <SignUp />}</div>
  );
}
export default LoginSignUp;
