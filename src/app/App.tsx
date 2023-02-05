function App() {
  const API_KEY = import.meta.env.VITE_API_KEY;
  return (
    <div className="App">
      <h1>headliners</h1>
      <p>api key via .env test: {API_KEY}</p>
    </div>
  );
}

export default App;
