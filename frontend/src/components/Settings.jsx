import React from 'react'
import { useState, useEffect } from 'react';
import axios from 'axios'

const Settings = ({ userId }) => {
    const [form, setForm] = useState({ id: "", username: "", mode: "", language: "" });
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);

   const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (submitted) setMessage("");   // Clear message if editing after submit
    setSubmitted(false);
  };

  const handleMode = (mode) => {
    setForm({ ...form, mode });
    if (submitted) setMessage("");
    setSubmitted(false);
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage(""); // Only set this on submit
    try {
      await axios.put(
        `http://127.0.0.1:8000/settings/update/${form.id}`,
        { username: form.username, mode: form.mode, language: form.language }
      );
      setMessage("Settings updated successfully!");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setMessage("User ID does not exist.");
      } else {
        setMessage("An error occurred.");
      }
    }
  };



    return (
        <div className='flex justify-center items-center min-h-full'>
            <form onSubmit={handleSubmit}>
                <div className='flex flex-col gap-4 border border-secondary-black rounded p-5 pt-8'>
                    <h1 className='font-bold text-xl'>You can always change this in the settings</h1>
                    <input
                        name="id"
                        type="number"
                        placeholder="User ID"
                        value={form.id}
                        onChange={handleChange}
                        required
                        className='border-b border-secondary-black w-sm focus:outline-0'
                    />
                    <input type="text" name="username" value={form.username} onChange={handleChange}
                        placeholder="Enter name" className='border-b w-sm focus:outline-0' />
                    <div>
                        <p>Choose the mode you want to study :</p>
                        <div className='flex gap-6 my-2'>
                            <button className='border border-secondary-black rounded px-6 py-1 text-sm hover:text-white hover:bg-secondary-black' onClick={() => handleMode("Kid")}>Kid</button>
                            <button className='border border-secondary-black rounded px-6 py-1 text-sm hover:text-white hover:bg-secondary-black' onClick={() => handleMode("Adult")}>Adult</button>
                        </div></div>
                    <div className="max-w-md">
                        <div className="mb-2 block">
                            <label htmlFor="language" className='text-secondary-black'>Choose Language</label>
                        </div>
                        <select id="languages" required className='focus:outline-0' value={form.language} onChange={handleChange}>
                            <option>English</option>
                            <option>Urdu</option>
                        </select>
                    </div>
                    <button type='submit' className='bg-blue-500 px-3 py-2 rounded text-white hover:bg-blue-600'>Submit</button>
                    <p>{submitted && message}</p>
                </div>
            </form>
        </div>
    )
}

export default Settings