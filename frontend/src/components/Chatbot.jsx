import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { MoveUp } from "lucide-react";


const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // Keep input bar fixed at bottom by making chat window scrollable and reserving space for input
  useEffect(() => {
    // Auto-scroll to latest message
    const chatArea = document.getElementById('chat-scroll-area');
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    const userInput = input;
    setInput('');

    try {
      const response = await axios.post('http://127.0.0.1:8001/chat', { message: userInput });
      setMessages([...newMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: 'system', content: 'Error: Could not get response from server.' },
      ]);
    }
  };

  return (
    <div className="max-w-[90%] mx-auto p-5 flex flex-col h-[95vh]">
      {/* Chat scroll area */}
      <div
        id="chat-scroll-area"
        className="rounded-lg p-4 overflow-y-auto mb-4 bg-transparent w-full flex-1"
        style={{ minHeight: '300px' }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 p-3 rounded-lg ${
              msg.role === 'user'
                ? 'ml-auto bg-blue-100 text-right w-fit'
                : msg.role === 'assistant'
                ? 'mr-auto text-left w-full'
                : 'mx-auto bg-red-100 text-center w-full'
            }`}
          >
            <strong className="block font-semibold mb-1">
              {msg.role === 'user'
                ? 'You'
                : msg.role === 'assistant'
                ? 'Assistant'
                : 'System'}
              :
            </strong>
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none prose-p:mb-12 prose-li:mb-8 prose-li:break-after">
                <ReactMarkdown
                  components={{
                    // Custom link styling
                    a: ({ node, children, href, ...props }) => (
                      <a
                        href={href}
                        className="text-blue-600 underline hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // Custom list item: extra line break after every point for heavy spacing
                    li: ({ children, ...props }) => (
                      <li {...props} className="mb-8">
                        {children}
                        <br />
                      </li>
                    ),
                    // Code blocks
                    code: ({ node, inline, className, children, ...props }) =>
                      inline ? (
                        <code className="bg-gray-200 px-1 rounded" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                          <code {...props}>{children}</code>
                        </pre>
                      ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        ))}
      </div>
      {/* Input bar, always at the bottom */}
      <div className="flex items-end sticky bottom-0 py-2" style={{ zIndex: 2 }}>
        {/* Dynamic input width based on content */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        <MoveUp />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
