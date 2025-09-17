import React from 'react'
import Nav from './components/Nav'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className='relative min-h-screen  bg-blue-100 font-kodchasan'>
      <div className='min-h-dvh flex absolute inset-0 bg-blue-100 bg-grid'>
        <Nav/>
        <div className='z-10 border border-white backdrop-blur-xs rounded bg-white/30 w-[90dvw] 
        max-w-[1200px] overflow-y-scroll my-4 mx-auto'>
            <Outlet />
        </div>
    </div>
    </div>
  )
}

export default Layout