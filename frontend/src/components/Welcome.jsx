import React from 'react'
import { Link } from 'react-router-dom'

const Welcome = () => {
  return (
    <div className='text-center text-secondary-black flex items-center justify-center h-full'>
        <div>
          <div className='text-center font-medium text-4xl mb-4'>
            <h1>Hello</h1>
            <h1>I am <p className='text-blue-600 inline'>Climate</p> Buddy</h1>
          </div>
          <p className='max-w-xl mb-6'> We're glad you're here. This is where your journey to become a climate champion begins. Explore lessons, track your impact, and act now for a greener tomorrow.</p>
          <Link to='/home'><button className='bg-blue-500 px-5 py-2 rounded text-white '>Next</button></Link>
        </div>

    </div>
  )
}

export default Welcome