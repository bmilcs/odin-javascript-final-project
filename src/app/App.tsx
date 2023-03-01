import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import Comedian from '@/pages/Comedian/Comedian';
import Home from '@/pages/Home/Home';
import SearchResults from '@/pages/SearchResults/SearchResults';
import Special from '@/pages/Special/Special';
import { Route, Routes } from 'react-router-dom';
import './App.scss';

function App() {
  return (
    <div className='app'>
      <Header />

      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path={'/comedians/:personId'} element={<Comedian />} />
          <Route path={'/specials/:specialId'} element={<Special />} />
          <Route path={'/search/:searchTerm'} element={<SearchResults />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
