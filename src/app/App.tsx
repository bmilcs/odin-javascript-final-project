import { useAppDispatch } from '@/app/hooks';
import { fetchAllComedians } from '@/app/store';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';
import Comedian from '@/pages/Comedian/Comedian';
import Comedians from '@/pages/Comedians/Comedians';
import Favorites from '@/pages/Favorites/Favorites';
import Home from '@/pages/Home/Home';
import LoginSignUp from '@/pages/LoginSignUp/LoginSignUp';
import SearchResults from '@/pages/SearchResults/SearchResults';
import Special from '@/pages/Special/Special';
import Specials from '@/pages/Specials/Specials';
import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  // allComedians data is used for search bar autocomplete & /comedians page
  dispatch(fetchAllComedians());

  return (
    <div className='app'>
      <Header />
      <main>
        <AnimatePresence>
          <ScrollToTop />
          <Routes location={location} key={location.key}>
            <Route path='/' element={<Home />} />
            <Route path={'/comedians'} element={<Comedians />} />
            <Route path={'/specials'} element={<Specials />} />
            <Route path={'/comedians/:personId'} element={<Comedian />} />
            <Route path={'/specials/:specialId'} element={<Special />} />
            <Route path={'/favorites'} element={<Favorites />} />
            <Route path={'/search/:searchTerm'} element={<SearchResults />} />
            <Route path={'/login'} element={<LoginSignUp initialView='login' />} />
            <Route path={'/signup'} element={<LoginSignUp initialView='signup' />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
