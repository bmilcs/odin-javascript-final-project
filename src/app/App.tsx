import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Comedian from "@/pages/Comedian/Comedian";
import Home from "@/pages/Home/Home";
import Special from "@/pages/Special/Special";
import { Route, Routes } from "react-router-dom";
import "./App.scss";

function App() {
  return (
    <div className="app">
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path={`/comedians/:personId`} element={<Comedian />} />
          <Route path={`/specials/:specialId`} element={<Special />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
