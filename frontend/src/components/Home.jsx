import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import LessonPage from './LessonPage'

const API_BASE_URL = 'http://127.0.0.1:8000'
const Home = () => {
  useEffect(() => {
    fetchLessons();
  }, [])

  const fetchLessons = async () => {
    try{
      const response = await axios.get(`${API_BASE_URL}/lessons`);
      console.log(response.data)
      const titles = response.data.map(item => item.title);
      console.log(titles);
    } catch (error) {
      console.error('Error fetching lessons', error)
    }
  }
  return (
    <div>
      <LessonPage />
    </div>
  )
}

export default Home