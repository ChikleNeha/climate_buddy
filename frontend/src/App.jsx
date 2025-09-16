import { useState } from 'react'
import './App.css'
import {BrowserRouter , Routes, Route} from 'react-router-dom'
import Layout from './Layout'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Chatbot from './components/Chatbot'
import Test from './components/Test'
import Register from './components/Register'
import EmissionsChart from './components/EmissionsChart'
import Settings from './components/Settings'

function App() {

  const [isUserRegistered, setIsUserRegistered] = useState(false)

  const handleUserRegistrationSuccess = () => {setIsUserRegistered(true)};


  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Layout/>}>
        {
          isUserRegistered? (<Route path='/' element={<Home/>}/>) : (<Route path='/' element={<Register onRegister={handleUserRegistrationSuccess}/>}/>)
        }
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/global-emissions' element={<EmissionsChart />} />
        <Route path='/chatbot' element={<Chatbot/>}/>
        <Route path='/test' element={<Test/>}/>
        <Route path='/settings' element={<Settings onRegister={handleUserRegistrationSuccess}/>} />
      </Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App
