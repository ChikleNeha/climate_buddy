import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For advanced Markdown features like tables

const API_BASE_URL = 'http://127.0.0.1:8000';

function LessonDisplay() {
  const [lessons, setLessons] = useState([]); // List of {id, title} from backend
  const [generatedLessons, setGeneratedLessons] = useState([]); // Array of generated content with IDs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // For displaying errors
  const [currentIndex, setCurrentIndex] = useState(0); // To process one by one for generation
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0); // Track current lesson
  const [showQuiz, setShowQuiz] = useState(false); // Toggle quiz after lesson
  const [quizIndex, setQuizIndex] = useState(0); // Current quiz question
  const [userAnswers, setUserAnswers] = useState([]); // Array of booleans for correct/incorrect
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Current selection

  // Fetch the list of lessons from backend using Axios
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/lessons`); // Your backend URL
        setLessons(response.data);
      } catch (err) {
        setError('Failed to fetch lessons: ' + (err.response?.data?.detail || err.message));
        console.error('Error fetching lessons:', err);
      }
    };
    fetchLessons();
  }, []);

  // Function to generate one lesson by sending POST with Axios
  const generateNextLesson = async () => {
    if (currentIndex >= lessons.length) return; // All done
    setLoading(true);
    setError(null); // Clear previous errors
    const topic = lessons[currentIndex].title;
    console.log(topic);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-lesson`, { topic });
      let generatedContent = response.data.lesson; // Assuming JSON or text

      // Safely parse if it's a string
      if (typeof generatedContent === 'string') {
        try {
          generatedContent = JSON.parse(generatedContent);
        } catch (parseError) {
          console.error('JSON parse failed:', parseError);
          setError('Failed to parse lesson content as JSON. Using raw text instead.');
          // Proceed with raw string as fallback
        }
      }
      console.log(generatedContent);

      // Save the lesson immediately after generation
      const saveResponse = await axios.post(`${API_BASE_URL}/save-lesson`, {
        title: topic,
        content: typeof generatedContent === 'string' ? JSON.parse(generatedContent) : generatedContent,
      });
      const lessonId = saveResponse.data.id;

      setGeneratedLessons((prev) => [...prev, { id: lessonId, title: topic, content: generatedContent }]);
      setCurrentIndex(currentIndex + 1); // Move to next
    } catch (err) {
      setError('Failed to generate or save lesson: ' + (err.response?.data?.detail || err.message));
      console.error('Error generating/saving lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to finish lesson and start quizzes
  const startQuizzes = () => {
    setShowQuiz(true);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]); // Reset for new quiz set
  };

  // Submit answer and move to next quiz
  const submitAnswer = () => {
    if (selectedAnswer === null) return; // Require selection
    const currentQuiz = generatedLessons[currentLessonIndex].content.quiz[quizIndex];
    const isCorrect = selectedAnswer === currentQuiz.correct_index;
    setUserAnswers([...userAnswers, isCorrect]);

    if (quizIndex < 2) { // 3 quizzes total
      setQuizIndex(quizIndex + 1);
      setSelectedAnswer(null);
    } else {
      evaluateQuizzes();
    }
  };

  // Evaluate after 3 quizzes and save response
  const evaluateQuizzes = () => {
    const correctCount = userAnswers.filter(isCorrect => isCorrect).length;
    
    // Prepare answers dict for storage (e.g., {"q1": true, "q2": false, "q3": true})
    const answersDict = userAnswers.reduce((acc, isCorrect, index) => {
      acc[`q${index + 1}`] = isCorrect;
      return acc;
    }, {});

    // Save to backend
    const lessonId = generatedLessons[currentLessonIndex].id;
    const userId = 1; // Replace with actual user ID
    saveResponse(lessonId, userId, answersDict, correctCount);

    // Proceed with evaluation
    setShowQuiz(false);
    setUserAnswers([]);
    if (correctCount >= 1) {
      alert("Good job! Proceeding to next lesson.");
      setCurrentLessonIndex(currentLessonIndex + 1); // Or trigger next generation
    } else {
      alert("Please repeat the previous lesson to improve.");
      // Optionally, reset to previous lesson
    }
  };

  // Function to save responses
  const saveResponse = async (lessonId, userId, answers, score) => {
    try {
      await axios.post('/save-response', {
        lesson_id: lessonId,
        user_id: userId,
        answers,
        score,
      });
      console.log('Response saved successfully');
    } catch (err) {
      setError('Failed to save response: ' + (err.response?.data?.detail || err.message));
      console.error('Error saving response:', err);
    }
  };

  // Enhanced helper function to format content as Markdown string
  const formatToMarkdown = (content) => {
    if (typeof content === 'string') {
      // If it's a comma-separated string, split into a list
      if (content.includes(',')) {
        return content.split(',').map(item => `- ${item.trim()}`).join('\n');
      }
      return content; // Already a string, use as-is
    } else if (Array.isArray(content)) {
      // If array, format as Markdown bullet list
      return content.map(item => `- ${item}`).join('\n');
    } else if (typeof content === 'object' && content !== null) {
      // If object, format key-value pairs as Markdown
      return Object.entries(content).map(([key, value]) => `**${key}:** ${value}`).join('\n\n');
    }
    return 'No content available'; // Fallback
  };

  return (
    <div>
      <h1>Generated Lessons</h1>
      {loading && <p>Loading next lesson...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {generatedLessons[currentLessonIndex] && !showQuiz ? (
        <div>
          <h2>{generatedLessons[currentLessonIndex].title}</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {formatToMarkdown(generatedLessons[currentLessonIndex]?.content?.introduction || 'No introduction available')}
          </ReactMarkdown>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {formatToMarkdown(generatedLessons[currentLessonIndex]?.content?.key_concepts || 'No key concepts available')}
          </ReactMarkdown>
          <button onClick={startQuizzes}>Next: Start Quiz</button>
        </div>
      ) : showQuiz ? (
        <div>
          <h3>Quiz Question {quizIndex + 1}: {generatedLessons[currentLessonIndex].content.quiz[quizIndex].question}</h3>
          {generatedLessons[currentLessonIndex].content.quiz[quizIndex].options.map((opt, idx) => (
            <div key={idx}>
              <input
                type="radio"
                value={idx}
                checked={selectedAnswer === idx}
                onChange={() => setSelectedAnswer(idx)}
              />
              {opt}
            </div>
          ))}
          <button onClick={submitAnswer}>Submit Answer</button>
        </div>
      ) : (
        <ul>
          {generatedLessons.map((item, index) => (
            <li key={index}>
              <h2>{item.title}</h2>
              {typeof item.content === 'string' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formatToMarkdown(item.content)}
                </ReactMarkdown>
              ) : (
                // Fallback for JSON content: Render key fields with Markdown
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formatToMarkdown(item.content?.introduction || 'No introduction available')}
                  </ReactMarkdown>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formatToMarkdown(item.content?.key_concepts || 'No key concepts available')}
                  </ReactMarkdown>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {currentIndex < lessons.length && (
        <button onClick={generateNextLesson}>Generate Next Lesson</button>
      )}
    </div>
  );
}

export default LessonDisplay;
