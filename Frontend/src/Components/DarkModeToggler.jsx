import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'; // Optional: replace with inline SVG if not using Heroicons
import Swal from 'sweetalert2';

const DarkModeToggler = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const handleToggle = () => {
    Swal.fire({
      title: 'Switch Theme',
      text: `Do you want to switch to ${darkMode ? 'Light' : 'Dark'} Mode?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Switch to ${darkMode ? 'Light' : 'Dark'} Mode`,
      cancelButtonText: 'Cancel',
      background: darkMode ? 'rgba(31,41,55,0.97)' : 'rgba(255,255,255,0.97)',
      color: darkMode ? 'white' : 'black',
      customClass: {
        popup: 'rounded-xl shadow-xl',
        confirmButton: darkMode
          ? 'bg-indigo-700 text-white px-4 py-2 rounded-md'
          : 'bg-indigo-600 text-white px-4 py-2 rounded-md',
        cancelButton: darkMode
          ? 'bg-gray-700 text-white px-4 py-2 rounded-md'
          : 'bg-gray-200 text-black px-4 py-2 rounded-md',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setDarkMode(!darkMode);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-yellow-300'
      } shadow-lg focus:outline-none`}
      title="Toggle Dark Mode"
    >
      {darkMode ? (
        <MoonIcon className="h-6 w-6 text-white transition-transform duration-300" />
      ) : (
        <SunIcon className="h-6 w-6 text-yellow-700 transition-transform duration-300" />
      )}
    </button>
  );
};

export default DarkModeToggler;
