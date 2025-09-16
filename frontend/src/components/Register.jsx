import React from 'react'
import { Label, Select } from "flowbite-react";
import { useState } from 'react';
import axios from 'axios'


const Register = ({ onRegister }) => {
      const [username, setUsername] = useState("");
    const [mode, setMode] = useState("");    // "Kid" or "Adult"
    const [language, setLanguage] = useState("English");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:8000/settings", {
                username, mode, language
            });
            alert("Settings saved!");
        } catch (err) { console.error(err); }
    };

  return (
    <div className='flex flex-col items-center justify-center h-full gap-4'>
      <h1 className='font-bold text-2xl -mb-2'>Join us to learn more and take action toward a more sustainable future</h1>
      <p className='max-w-3/5 text-center'>This learning platform will provide evidence-based information, explore the latest climate science, and empower you to understand and participate in effective climate action.</p>
      <div className='flex flex-col gap-4 border border-secondary-black rounded p-5 pt-8'>
        <input type="text"  value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter name" className='border-b w-sm focus:outline-0'/>
       <div>
        <p>Choose the mode you want to study :</p>
        <div className='flex gap-6 my-2'>
          <button className='border border-secondary-black rounded px-6 py-1 text-sm hover:text-white hover:bg-secondary-black' onClick={() => setMode("Kid")}>Kid</button>
          <button className='border border-secondary-black rounded px-6 py-1 text-sm hover:text-white hover:bg-secondary-black' onClick={() => setMode("Adult")}>Adult</button>
        </div></div> 
        <div className="max-w-md">
          <div className="mb-2 block">
            <label htmlFor="language" className='text-secondary-black'>Choose Language</label>
          </div>
          <Select id="languages" required value={language} onChange={e => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Urdu</option>
          </Select>
        </div>
      </div>
      <button onClick={onRegister} className='bg-blue-500 px-3 py-2 rounded text-white'>Register</button>
    </div>
  )
}

export default Register