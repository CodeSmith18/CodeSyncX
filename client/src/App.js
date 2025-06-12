import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from './components/Home';
import EditorPage from './components/EditorPage';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import LandingPage from './components/Landing';

function App() {
  return (
    <>
    <div>
      <Toaster  position='top-center'></Toaster>
    </div>
    <Routes>
     <Route path='/' element={ <Home /> } />
     <Route path='/landing' element = {<LandingPage></LandingPage>}></Route>
     <Route path='/editor/:roomId' element={ <EditorPage /> } />
     <Route path='/dashboard' element = {<Dashboard></Dashboard>}> </Route>
    </Routes>
    </>
  );
}

export default App;
