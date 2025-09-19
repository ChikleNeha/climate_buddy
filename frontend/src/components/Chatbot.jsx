import React, { useState } from "react";
import axios from "axios";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(null);
  const API_BASE_URL = 'http://127.0.0.1:8000'

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, { query: input });
      console.log(res)
      setResponse(res.data.reply || "Success!");
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.detail || err.message));
      console.error(err)
    }
    setInput("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white shadow-lg rounded-3xl p-8 text-center max-w-md w-full">
        <h2 className="text-lg font-medium text-gray-600">Hello</h2>
        <h1 className="text-2xl font-bold text-gray-800">
          I am <span className="text-blue-500">Climate</span> Buddy
        </h1>
        <p className="text-gray-500 mt-2">How can I help you?</p>
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex items-center bg-white border-2 border-blue-400 rounded-full overflow-hidden"
        >
          <input
            type="text"
            placeholder="Ask something"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow px-4 py-2 outline-none text-gray-700 bg-transparent"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            ↓
          </button>
        </form>
        {response && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
