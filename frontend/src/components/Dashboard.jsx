
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import axios from "axios";
import { Link } from "react-router-dom";
import { MoveRightIcon } from "lucide-react";


const Dashboard = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/co2e-summary/")  // Adjust port/path as needed
            .then((res) => setData(res.data));
    }, []);

    return (
        <div>
            <div className="max-w-4xl mx-auto mt-10 ">
                <div className="flex mx-auto justify-between mb-5"><p>do you want to see the actual global data</p>
                <Link to='/global-emissions'><button className=" text-secondary-black rounded px-3 py-2 text-sm">Click here <MoveRightIcon className="inline-flex"/></button></Link></div>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="scenario_type" />
                        <YAxis
                            label={{ value: 'CO2e in Kg', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="used_co2e" fill="#4A4E69" name="Used CO2e" />
                        <Bar dataKey="saved_co2e" fill="#60A5FA" name="Saved CO2e" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default Dashboard

