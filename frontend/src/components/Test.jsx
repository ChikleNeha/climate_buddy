// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function Test() {
  const [scenarios, setScenarios] = useState([]); // history of scenarios
  const [currentIndex, setCurrentIndex] = useState(-1); // pointer to current scenario
  const [message, setMessage] = useState("");

  const fetchScenario = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/next_scenario");
      const newScenario = res.data;
      setScenarios((prev) => [...prev, newScenario]);
      setCurrentIndex((prev) => prev + 1);
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const playOption = async (option) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/play", {
        scenario_id: scenarios[currentIndex].id,
        option_id: option.id,
      });
      setMessage(
        `${res.data.message} | Used: ${res.data.used_co2e} | Saved: ${res.data.saved_co2e}`
      );
    } catch (err) {
      console.error(err);
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
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setMessage("");
    }
  };

  if (currentIndex < 0 || !scenarios[currentIndex]) return <p>Loading...</p>;

  const scenario = scenarios[currentIndex];

  return (
    <div className="p-6 max-w-2xl flex flex-col justify-center mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">{scenario.prompt}</h1>
      <div className="space-y-2">
        {scenario.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => playOption(opt)}
            className="block w-full p-3 rounded-md border border-secondary-black text-secondary-black hover:bg-gray-500 hover:text-white"
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

      {message && (
        <p className="mt-4 p-3 bg-gray-100 rounded-xl">{message}</p>
      )}
      <p className="my-4">wanna learn more about how you daily life choices impact the environment, ask our chatbot!</p>
    </div>
  );
}
