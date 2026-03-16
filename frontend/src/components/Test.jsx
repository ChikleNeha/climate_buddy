// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function Test() {
  const [scenarios, setScenarios] = useState([]); // history of scenarios
  const [currentIndex, setCurrentIndex] = useState(-1); // pointer to current scenario
  const [message, setMessage] = useState("");
  const [sarcasticMessage, setSarcasticMessage] = useState(""); // New state for sarcastic feedback
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false); // Loading state for normal feedback
  const [isLoadingSarcasm, setIsLoadingSarcasm] = useState(false); // Loading state for sarcastic feedback

  // Log sarcasticMessage after it updates (for debugging)
  useEffect(() => {
    if (sarcasticMessage) {
      console.log("Updated sarcasticMessage:", sarcasticMessage);
    }
  }, [sarcasticMessage]);

  const fetchScenario = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/next_scenario");
      const newScenario = res.data;
      setScenarios((prev) => [...prev, newScenario]);
      setCurrentIndex((prev) => prev + 1);
      setMessage("");
      setSarcasticMessage(""); // Reset sarcastic message
    } catch (err) {
      console.error(err);
    }
  };

  const playOption = async (option) => {
    setIsLoadingFeedback(true); // Start loading for feedback
    try {
      const res = await axios.post("http://127.0.0.1:8000/play", {
        scenario_id: scenarios[currentIndex].id,
        option_id: option.id,
      });
      // Wrap feedback in simple Markdown
      const feedback = `**Message:** ${res.data.message}  \n\n**Used:** ${res.data.used_co2e} kg CO2e  \n\n**Saved:** ${res.data.saved_co2e} kg CO2e`;
      setMessage(feedback);

      // Fetch sarcastic version
      setIsLoadingSarcasm(true);
      const sarcasticRes = await axios.post("http://127.0.0.1:8001/sarcastic_feedback", { feedback });
      console.log("sarcasticRes:", sarcasticRes); // Log the full response object
      setSarcasticMessage(sarcasticRes.data.reply || ""); // Set state (async)
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFeedback(false);
      setIsLoadingSarcasm(false);
    }
  };

  useEffect(() => {
    fetchScenario();
  }, []);

  const handleNext = () => {
    if (currentIndex === scenarios.length - 1) {
      fetchScenario(); // new random scenario from backend
    } else {
      setCurrentIndex((prev) => prev + 1); // move forward in history
      setMessage("");
      setSarcasticMessage(""); // Reset sarcastic message
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setMessage("");
      setSarcasticMessage(""); // Reset sarcastic message
    }
  };

  if (currentIndex < 0 || !scenarios[currentIndex]) return <p>Loading...</p>;

  const scenario = scenarios[currentIndex];

  return (
    <div className="h-full overflow-y-scroll">
      <div className="p-6 max-w-2xl flex flex-col justify-center mx-auto max-h-[88dvh]">
      <h1 className="text-2xl font-bold mb-4">{scenario.prompt}</h1>
      <div className="space-y-2">
        {scenario.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => playOption(opt)}
            className="block w-full p-3 rounded-md border border-secondary-black text-secondary-black hover:bg-blue-200"
          >
            {opt.text}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 rounded bg-secondary-black text-white"
        >
          Next
        </button>
      </div>

      {isLoadingFeedback ? (
        <p className="mt-4 p-3 bg-gray-100 rounded-xl text-sm text-secondary-black">Loading feedback...</p>
      ) : (
        message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-xl text-sm text-secondary-black">
            <ReactMarkdown>{message}</ReactMarkdown>
          </div>
        )
      )}
      {isLoadingSarcasm ? (
        <p className="mt-4 p-3 bg-blue-100 rounded-xl text-sm text-secondary-black italic">Loading sarcastic feedback...</p>
      ) : (
        sarcasticMessage && (
          <div className="mt-4 p-3 bg-blue-100 rounded-xl text-sm text-secondary-black">
            <ReactMarkdown>
              {sarcasticMessage}
            </ReactMarkdown>
          </div>
        )
      )}
    </div>
    </div>
  );
}
