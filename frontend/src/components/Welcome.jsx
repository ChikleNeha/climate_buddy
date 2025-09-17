import React from 'react'
import { Link } from 'react-router-dom'

const Welcome = () => {
  return (
    <div>
        <div>
          <h1>welcome to the app</h1>
          <Link to='/home'><button className='bg-blue-500'>next</button></Link>
        </div>

    </div>
  )
}

export default Welcome