import React from 'react';
import './App.css';
import SpeedometerChart from './components/SpeedometerChart';

function App() {
  return (
    <div className="App">
      <SpeedometerChart percentValue={40}/>
    </div>
  );
}

export default App;
