/*
------------------------------------------------
File: Settings.jsx
Purpose: Unified system and profile settings.
Responsibilities: Manages theme selectors, notifications switches, accent colors, font sizes, and alert preferences persisted to backend.
Dependencies: react, Card, ThemeContext, axiosClient, lucide-react
------------------------------------------------
*/

import React, { useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import { ThemeContext, themesList } from '../contexts/ThemeContext';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Palette, 
  Bell, 
  Mail, 
  Smartphone, 
  Info,
  Type
} from 'lucide-react';

const Settings = () => {
  const { 
    darkMode, toggleTheme, accentColor, setAccentColor, 
    fontSize, setFontSize, customColor, setCustomColor 
  } = useContext(ThemeContext);
  
  // Settings States
  const [selectedTheme, setSelectedTheme] = useState(darkMode ? 'dark' : 'light');
  const [alerts, setAlerts] = useState({
    grade: true,
    weekly: true,
    messages: true,
    deadlines: true,
    marketing: false
  });
  const [channel, setChannel] = useState('email');
  const [loading, setLoading] = useState(true);

  const accentColors = [
    { id: 'purple', class: 'bg-[#8b5cf6]', hex: '#8b5cf6' },
    { id: 'blue', class: 'bg-[#3b82f6]', hex: '#3b82f6' },
    { id: 'teal', class: 'bg-[#14b8a6]', hex: '#14b8a6' },
    { id: 'green', class: 'bg-[#22c55e]', hex: '#22c55e' },
    { id: 'orange', class: 'bg-[#f97316]', hex: '#f97316' },
    { id: 'pink', class: 'bg-[#ec4899]', hex: '#ec4899' }
  ];

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/auth/settings');
        if (res.data.success) {
          const s = res.data.settings;
          setSelectedTheme(s.theme || 'dark');
          setAccentColor(s.accent_color || 'purple');
          setFontSize(s.font_size || 'medium');
          setAlerts({
            grade: s.email_grade ?? true,
            weekly: s.weekly_summary ?? true,
            messages: s.new_messages ?? true,
            deadlines: s.upcoming_deadlines ?? true,
            marketing: s.marketing ?? false
          });
          setChannel(s.notification_channel || 'email');
        }
      } catch (err) {
        console.error('Failed to load backend settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (updates) => {
    try {
      // Map frontend fields to match database snake_case structure
      const payload = {};
      if (updates.theme !== undefined) payload.theme = updates.theme;
      if (updates.accentColor !== undefined) payload.accent_color = updates.accentColor;
      if (updates.fontSize !== undefined) payload.font_size = updates.fontSize;
      if (updates.grade !== undefined) payload.email_grade = updates.grade;
      if (updates.weekly !== undefined) payload.weekly_summary = updates.weekly;
      if (updates.messages !== undefined) payload.new_messages = updates.messages;
      if (updates.deadlines !== undefined) payload.upcoming_deadlines = updates.deadlines;
      if (updates.marketing !== undefined) payload.marketing = updates.marketing;
      if (updates.channel !== undefined) payload.notification_channel = updates.channel;

      await axiosClient.put('/auth/settings', payload);
    } catch (err) {
      console.error('Failed to save settings changes to backend:', err);
    }
  };

  const handleThemeChange = (mode) => {
    setSelectedTheme(mode);
    saveSettings({ theme: mode });

    // Handle context toggles
    if (mode === 'dark' && !darkMode) {
      toggleTheme();
    } else if (mode === 'light' && darkMode) {
      toggleTheme();
    } else if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark !== darkMode) {
        toggleTheme();
      }
    }
  };

  const handleAccentChange = (colorId) => {
    setAccentColor(colorId);
    saveSettings({ accentColor: colorId });
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    saveSettings({ fontSize: size });
  };

  const handleAlertToggle = (key) => {
    const val = !alerts[key];
    setAlerts(prev => ({
      ...prev,
      [key]: val
    }));
    saveSettings({ [key]: val });
  };

  const handleChannelChange = (ch) => {
    setChannel(ch);
    saveSettings({ channel: ch });
  };

  const getFontSizeClass = () => {
    if (fontSize === 'small') return 'text-[11px]';
    if (fontSize === 'large') return 'text-[14px]';
    return 'text-xs';
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-12 text-center">Loading settings details...</p>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Settings</span>
          <span className="text-blue-500">⚙️</span>
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Configure visual themes, password settings, and notifications permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Appearance Options */}
        <div className="space-y-6">
          <Card>
            <div className="space-y-6">
              
              {/* Card Title */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <span className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Appearance Options</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Customize the look and feel of your dashboard.</p>
                </div>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-4">
                  
                  {/* Dark Theme Button */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 relative ${
                      selectedTheme === 'dark' 
                        ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/[0.02]' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <Moon className={`w-5 h-5 ${selectedTheme === 'dark' ? 'text-purple-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Default dark theme</p>
                    </div>
                    {selectedTheme === 'dark' && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Light Theme Button */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 relative ${
                      selectedTheme === 'light' 
                        ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/[0.02]' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <Sun className={`w-5 h-5 ${selectedTheme === 'light' ? 'text-purple-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Light</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Clean light theme</p>
                    </div>
                    {selectedTheme === 'light' && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* System Theme Button */}
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 relative ${
                      selectedTheme === 'system' 
                        ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/[0.02]' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <Monitor className={`w-5 h-5 ${selectedTheme === 'system' ? 'text-purple-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">System</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Use system preference</p>
                    </div>
                    {selectedTheme === 'system' && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>

                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Accent Color / Theme Preset
                  </label>
                  <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    13 Options
                  </span>
                </div>
                
                <div className="grid grid-cols-6 gap-3 pt-1">
                  {Object.keys(themesList).map(key => {
                    const t = themesList[key];
                    const isSelected = accentColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleAccentChange(key)}
                        style={{ backgroundColor: t.primary }}
                        title={t.name}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 relative transition-all transform hover:scale-110 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer"
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white stroke-2" />
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Color Selector Button */}
                  <div className="w-8 h-8 rounded-full relative flex items-center justify-center border-2 border-white dark:border-slate-800 overflow-hidden shadow-sm">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        handleAccentChange('custom');
                        setCustomColor(e.target.value);
                      }}
                      className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                      title="Custom Color Theme"
                    />
                    {accentColor === 'custom' && (
                      <Check className="w-4 h-4 text-white stroke-2 absolute pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="block w-full max-w-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (Default)</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Preview Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center gap-3">
                <Type className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Preview</p>
                  <p className={`font-semibold text-slate-650 dark:text-slate-355 mt-1 ${getFontSizeClass()}`}>
                    This is how your dashboard text will look.
                  </p>
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Right Column: Alert Options */}
        <div className="space-y-6">
          <Card>
            <div className="space-y-6">
              
              {/* Card Title */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <span className="p-1.5 bg-blue-500/10 text-blue-505 rounded-lg">
                  <Bell className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Alert Options</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage how and when you receive alerts.</p>
                </div>
              </div>

              {/* Checkbox List */}
              <div className="space-y-4 font-sans text-xs">
                
                {/* 1. Email Grade */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Email Grade Notifications</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Sends alerts when activities are evaluated by faculty.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.grade}
                    onChange={() => handleAlertToggle('grade')}
                    className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-blue-605 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </div>

                {/* 2. Weekly Progress Summary */}
                <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-900/60">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Weekly Progress Summary</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Receive a weekly summary of your progress.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.weekly}
                    onChange={() => handleAlertToggle('weekly')}
                    className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-blue-605 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </div>

                {/* 3. New Messages */}
                <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-900/60">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">New Messages</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Get notified when you receive new messages.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.messages}
                    onChange={() => handleAlertToggle('messages')}
                    className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-blue-605 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </div>

                {/* 4. Upcoming Deadlines */}
                <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-900/60">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Upcoming Deadlines</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Receive reminders for upcoming tests and deadlines.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.deadlines}
                    onChange={() => handleAlertToggle('deadlines')}
                    className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-blue-605 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </div>

                {/* 5. Marketing & Updates */}
                <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-900/60">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Marketing &amp; Updates</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Receive news about new features and platform updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.marketing}
                    onChange={() => handleAlertToggle('marketing')}
                    className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-blue-605 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </div>

              </div>

              {/* Notification Channel */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Notification Channel
                </label>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Email Channel */}
                  <button
                    onClick={() => handleChannelChange('email')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      channel === 'email'
                        ? 'border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Email</span>
                    </div>
                    <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      channel === 'email' ? 'border-blue-500 bg-blue-500' : 'border-slate-350'
                    }`}>
                      {channel === 'email' && <span className="w-1 h-1 bg-white rounded-full"></span>}
                    </span>
                  </button>

                  {/* In-App Channel */}
                  <button
                    onClick={() => handleChannelChange('in-app')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      channel === 'in-app'
                        ? 'border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span>In-App</span>
                    </div>
                    <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      channel === 'in-app' ? 'border-blue-500 bg-blue-500' : 'border-slate-350'
                    }`}>
                      {channel === 'in-app' && <span className="w-1 h-1 bg-white rounded-full"></span>}
                    </span>
                  </button>

                </div>
              </div>

              {/* Bottom Tip Info Banner */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <Info className="w-4 h-4 text-blue-550 shrink-0" />
                <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400">
                  You can manage email preferences or unsubscribe anytime.
                </p>
              </div>

            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default Settings;
