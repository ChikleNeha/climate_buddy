import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from "recharts";
import { Link } from "react-router-dom";
import { MoveLeftIcon } from "lucide-react";

export default function EmissionsChart() {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");
  const [drillData, setDrillData] = useState(null);

  // Load aggregated emissions
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/emissions")
      .then((res) => {
        setData(res.data);
        setCountries(res.data.map(d => d.country));
      });
  }, []);

  // Drill-down handler
  const handleCountryClick = (country) => {
    axios.get(`http://127.0.0.1:8000/emissions/${country}`)
      .then((res) => setDrillData({ country, data: res.data }));
  };

  // Apply filter
  const filteredData = data.map(d => {
    if (selectedSector === "all") return d;
    return { country: d.country, [selectedSector]: d[selectedSector] };
  });

  return (
    <div className="w-5xl mx-auto mt-10">
      <div className="flex justify-between">
        <div className="mb-4">
          <select
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-4 py-2 border-0 focus:outline-none bg-white text-gray-700"
          >
            <option value="all">All Sectors</option>
            <option value="Power">Power</option>
            <option value="Industry">Industry</option>
            <option value="Ground Transport">Ground Transport</option>
            <option value="Domestic Aviation">Domestic Aviation</option>
            <option value="International Aviation">International Aviation</option>
            <option value="Residential">Residential</option>
          </select>
          <select
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 border-0 focus:outline-none bg-white text-gray-700 ml-2"
          >
            <option value="all">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Link to='/dashboard'><button className="text-secondary-black rounded px-3 py-2 text-sm"><MoveLeftIcon className="inline-flex"/> Go Back</button></Link>
      </div>

      {/* Aggregated Grouped Bar Chart */}
      {!drillData && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={selectedCountry === "all" ? filteredData : filteredData.filter(d => d.country === selectedCountry)}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onClick={(chart) => {
              if (chart && chart.activeLabel) handleCountryClick(chart.activeLabel);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis label={{ value: 'CO2e in Kg', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Power" fill="#22223B" />
            <Bar dataKey="Industry" fill="#4A4E69" />
            <Bar dataKey="Ground Transport" fill="#9A8C98" />
            <Bar dataKey="Domestic Aviation" fill="#C6AC8F" />
            <Bar dataKey="International Aviation" fill="#343a40" />
            <Bar dataKey="Residential" fill="#84a98c" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Drill-down Line Chart with markers */}
      {drillData && (
        <div>
          <div className="flex gap-6 my-6 items-center justify-center">
            <h3>{drillData.country} – Emissions Over Time</h3>
            <button
              className="mb-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setDrillData(null)}
            >
              Back
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={drillData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Power" stroke="#22223B" dot />
              <Line type="monotone" dataKey="Industry" stroke="#4A4E69" dot />
              <Line type="monotone" dataKey="Ground Transport" stroke="#9A8C98" dot />
              <Line type="monotone" dataKey="Domestic Aviation" stroke="#C6AC8F" dot />
              <Line type="monotone" dataKey="International Aviation" stroke="#343a40" dot />
              <Line type="monotone" dataKey="Residential" stroke="#84a98c" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
