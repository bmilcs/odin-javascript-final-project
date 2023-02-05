import { fetchTest } from "@/api/TMDB";

function App() {
  const results = fetchTest().then((res) => console.log(res));
  return (
    <div className="App">
      <h1>headliners</h1>
    </div>
  );
}

export default App;
