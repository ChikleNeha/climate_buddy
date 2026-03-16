// LessonPage.js - React component for displaying lessons with Markdown and navigation
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Mic, StopCircle } from 'lucide-react'; // Import Lucide icons

const LessonPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks current lesson topic index
  const [lesson, setLesson] = useState({ lesson_id: null, title: '', content: '' }); // Current lesson data
  const [isLoadingLesson, setIsLoadingLesson] = useState(false); // Loading state for lessons
  const [error, setError] = useState(''); // Error message for UI feedback

  // Fetch lesson on mount or index change
  useEffect(() => {
    fetchLesson(currentIndex);
  }, [currentIndex]);

  const fetchLesson = async (index) => {
    setIsLoadingLesson(true);
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8001/generate', { topic_index: index });
      setLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleNextLesson = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePreviousLesson = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1)); // Prevent going below 0
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-secondary-black overflow-y-scroll max-h-[90dvh]">
      <div className='flex items-center justify-between'>
        <h1 className="text-3xl font-bold text-center">{lesson.title || ''}</h1>
        <SpeechPlayer text={lesson.content} />
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {isLoadingLesson ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500"></div>
          <p className="ml-4 text-lg">Loading lesson content...</p>
        </div>
      ) : (
        <>
          {/* Render lesson content with Markdown */}
          <div className="prose prose-lg max-w-none mb-8 prose-p:mb-12 prose-li:mb-8 prose-li:break-after mt-4">
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
                  <li {...props} className="mb-2">
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
              {lesson.content}
            </ReactMarkdown>
          </div>

          {/* Navigation Options */}
          <div className="flex justify-between space-x-4">
            <button
              onClick={handlePreviousLesson}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Previous Lesson
            </button>
            <button
              onClick={handleNextLesson}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Next Lesson
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// SpeechPlayer Component (Add this in the same file or import from another)
const SpeechPlayer = ({ text }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For toggling language dropdown
  const utteranceRef = useRef(null);

  // Map for friendly language names and info
  const languageMap = {
    'en-US': { name: 'English', info: 'US accent' },
    'mr-IN': { name: 'Marathi', info: 'Indian voice' },
    'ur-PK': { name: 'Urdu', info: 'Pakistani voice' },
    'hi-IN': { name: 'Hindi', info: 'Indian voice' },
    'fr-FR': { name: 'French', info: 'France voice' },
    'es-ES': { name: 'Spanish', info: 'Spain voice' },
    'de-DE': { name: 'German', info: 'Germany voice' },
    'zh-CN': { name: 'Chinese', info: 'Mandarin' },
    'ja-JP': { name: 'Japanese', info: 'Standard voice' },
    // Add more as needed
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) setSelectedVoice(availableVoices[0]);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Function to strip Markdown from text for clean speech
  const stripMarkdown = (mdText) => {
    return mdText
      .replace(/[#*_`~]/g, '') // Remove common Markdown symbols
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Replace links with text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '$1') // Replace images with alt text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  };

  const readAloud = (voice) => {
    if (isSpeaking || !text) return;

    const cleanText = stripMarkdown(text); // Strip Markdown before speaking
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel(); // Cancel all ongoing speech
    setIsSpeaking(false);
    utteranceRef.current = null; // Clear reference
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="mt-4 flex items-center space-x-4">
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="p-2 rounded relative"
          title="Read Aloud"
        >
          <Mic className="h-6 w-6 text-secondary-black m-0" />
        </button>

        {isDropdownOpen && !isSpeaking && (
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-48 rounded-md bg-white max-h-60 overflow-auto shadow-lg mt-28">
            {voices.map((v) => {
              const langData = languageMap[v.lang] || { name: v.lang, info: 'Standard voice' };
              return (
                <button
                  key={v.name}
                  onClick={() => {
                    readAloud(v);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900 text-left"
                >
                  <span className="font-medium">{langData.name}</span>
                  <span className="text-xs text-gray-500 block">{langData.info}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="px-4 py-2 bg-blue-200 text-white rounded hover:bg-blue-300"
        >
          Stop
        </button>
      )}
    </div>
  );
};

export default LessonPage;
