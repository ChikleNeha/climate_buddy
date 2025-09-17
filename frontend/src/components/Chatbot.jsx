import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';

const Chatbot = () => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log('User input:', inputValue);
      // Handle the input submission here (e.g., integrate with your FastAPI backend)
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">
            Hello
          </h1>
          <h2 className="text-2xl font-normal text-gray-800 mb-4">
            I am <span className="text-md-blue font-medium">Climate</span> Buddy
          </h2>
          <p className="text-gray-600 text-base">
            How can I help you?
          </p>
        </div>

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask something"
              className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-md-blue focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
