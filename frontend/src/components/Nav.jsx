import React from 'react'
import { Menu, X, House, LayoutDashboard,  BookOpenCheck, Bot, Settings } from "lucide-react";
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Nav = () => {

  const [open, setOpen] = useState(false);

    const links = [
    { icon: <House />, path: "/", id: 1 },
    { icon: <LayoutDashboard />, path: "/dashboard", id: 2 },
    { icon: <BookOpenCheck />, path: "/test", id: 3 },
    { icon: <Bot />, path: "/chatbot", id: 4 },
    { icon: <Settings />, path: "/settings", id: 5 },
  ];

  return (
    <div className='flex'>
      <div className='relative'>
       {/* Mobile Hamburger */}
        <button
          className="sm:hidden text-2xl p-2"
          aria-label={open ? "Close Menu" : "Open Menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} className="text-white" /> : <Menu size={24} className="text-secondary-black"/>}
        </button>
      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile Menu */}
      <ul
        className={`fixed top-0 left-0 min-h-screen min-w-10 bg-secondary-black  text-white pt-20 space-y-10 transform transition-transform duration-300 z-50 ${open ? "inline" : "hidden"}`}
      >
        {links.map((link) => (
          <li key={link.id} className="px-6 py-4" onClick={() => setOpen(false)}>
            <Link to={link.path}>{link.icon}</Link>
          </li>
        ))}
      </ul>

    </div>
    {/* desktop menu */}
    <div className="hidden md:flex items-start gap-10 flex-col p-6 justify-center bg-secondary-black my-4 ml-4 rounded-md min-h-[95dvh]">
          {links.map((link) => (
            <Link
              to={link.path}
              key={link.id}
              className="text-white w-auto focus:border-l-2 hover:text-blue-200 pl-2 transition inline-flex"
            >
              {link.icon}
            </Link>
          ))}
        </div>
    </div>
  )
}

export default Nav