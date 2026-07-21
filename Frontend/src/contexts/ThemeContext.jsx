/*
------------------------------------------------
File: ThemeContext.jsx
Purpose: Global UI theme context.
Responsibilities: Toggles light/dark mode and updates DOM root element styles.
Dependencies: react
------------------------------------------------
*/

import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || 'purple');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium');

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const colors = {
      purple: { hex: '#8b5cf6', rgb: '139, 92, 246', hover: '#7c3aed' },
      blue: { hex: '#3b82f6', rgb: '59, 130, 246', hover: '#2563eb' },
      teal: { hex: '#14b8a6', rgb: '20, 184, 166', hover: '#0d9488' },
      green: { hex: '#22c55e', rgb: '34, 197, 94', hover: '#16a34a' },
      orange: { hex: '#f97316', rgb: '249, 115, 22', hover: '#ea580c' },
      pink: { hex: '#ec4899', rgb: '236, 72, 153', hover: '#db2677' }
    };
    const c = colors[accentColor] || colors.purple;

    let style = document.getElementById('dynamic-accent-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-accent-styles';
      document.head.appendChild(style);
    }

    style.innerHTML = `
      :root {
        --color-accent: ${c.hex};
        --color-accent-hover: ${c.hover};
        --color-accent-rgb: ${c.rgb};
      }
      
      .accent-bg-primary {
        background-color: ${c.hex} !important;
      }
      .accent-bg-hover:hover {
        background-color: ${c.hover} !important;
      }
      .accent-text-primary {
        color: ${c.hex} !important;
      }
      .accent-border-primary {
        border-color: ${c.hex} !important;
      }
      .accent-shadow-primary {
        box-shadow: 0 10px 15px -3px rgba(${c.rgb}, 0.25) !important;
      }
    `;
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  /*
  Toggles current theme state.
  */
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, accentColor, setAccentColor, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};
