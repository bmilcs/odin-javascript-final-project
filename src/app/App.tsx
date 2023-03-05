import { useAppDispatch } from '@/app/hooks';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { fetchAllComedians } from '@/features/allComediansSlice/allComediansSlice';
import Comedian from '@/pages/Comedian/Comedian';
import Comedians from '@/pages/Comedians/Comedians';
import Favorites from '@/pages/Favorites/Favorites';
import Home from '@/pages/Home/Home';
import SearchResults from '@/pages/SearchResults/SearchResults';
import Special from '@/pages/Special/Special';
import Specials from '@/pages/Specials/Specials';
import { Route, Routes } from 'react-router-dom';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  dispatch(fetchAllComedians());

  return (
    <div className='app'>
      <Header />

      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path={'/comedians'} element={<Comedians />} />
          <Route path={'/comedians/:personId'} element={<Comedian />} />
          <Route path={'/specials'} element={<Specials />} />
          <Route path={'/specials/:specialId'} element={<Special />} />
          <Route path={'/favorites'} element={<Favorites />} />
          <Route path={'/search/:searchTerm'} element={<SearchResults />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
