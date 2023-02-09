import Comedian from "@/pages/Comedian/Comedian";
import Home from "@/pages/Home/Home";
import { Route, Routes } from "react-router-dom";
import "./App.scss";

function App() {
  return (
    <div className="App">
      <h1>the comedy db</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={`/comedians/:personId`} element={<Comedian />} />
      </Routes>
    </div>
  );
}

export default App;
