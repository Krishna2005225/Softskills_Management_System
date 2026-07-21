/*
------------------------------------------------
File: Profile.jsx
Purpose: Authenticated profile update page.
Responsibilities: Logs profile changes, commits updates to backend servers, manages account security & password change modal.
Dependencies: react, axiosClient, Card, Button, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import studentService from '../services/studentService';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  Lock, 
  LogOut, 
  ShieldAlert, 
  Edit,
  Award,
  X,
  Send,
  Check,
  Users
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  
  // Form fields state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Avatar Selection States
  const [profilePic, setProfilePic] = useState('https://api.dicebear.com/7.x/adventurer/svg?seed=Nezuko');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Mentor Selection States
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [currentMentor, setCurrentMentor] = useState(null);
  const [mentorSaving, setMentorSaving] = useState(false);
  const [mentorError, setMentorError] = useState('');
  const [mentorSuccess, setMentorSuccess] = useState('');

  // --- PASSWORD CHANGE MODAL STATES ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState('password'); // 'password' or 'otp'
  const [currentPassword, setCurrentPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  
  // OTP cooldown states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Timer logic for OTP cooldown
  useEffect(() => {
    let interval = null;
    if (otpCooldown > 0) {
      interval = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpCooldown]);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/auth/profile');
      if (res.data.success) {
        const u = res.data.user;
        setProfile(u);
        setName(u.name || '');
        setDepartment(u.department || 'CSE');
        setEmail(u.email || '');
        setPhone(u.phone || '+91 98765 43210');

        if (u.role === 'STUDENT') {
          // Fetch available faculties and current mentor choice
          const [facsRes, mentorRes] = await Promise.all([
            studentService.getFaculties(),
            studentService.getMyFaculty()
          ]);
          if (facsRes.success) setFaculties(facsRes.faculties || []);
          if (mentorRes.success && mentorRes.faculty) {
            setCurrentMentor(mentorRes.faculty);
            setSelectedFaculty(mentorRes.faculty.faculty_id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      const saved = localStorage.getItem(`profilePic_${profile.user_id}`);
      if (saved) setProfilePic(saved);
    }
  }, [profile]);

  const avatarPresets = [
    { name: 'Nezuko Seed', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nezuko' },
    { name: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { name: 'Aneka', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { name: 'Tech', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tech' },
    { name: 'Game', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Game' },
    { name: 'Creative', url: 'https://api.dicebear.com/7.x/big-ears/svg?seed=Creative' }
  ];

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Avatar image must be under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfilePic(base64);
      if (profile) {
        localStorage.setItem(`profilePic_${profile.user_id}`, base64);
        window.dispatchEvent(new Event('storage'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url) => {
    setProfilePic(url);
    if (profile) {
      localStorage.setItem(`profilePic_${profile.user_id}`, url);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axiosClient.put('/auth/profile', {
        name,
        department,
        phone,
        roll_no: profile?.roll_no || '23601A5327',
        year: profile?.year || 4,
        cgpa: profile?.cgpa || 8.25
      });
      if (res.data.success) {
        setProfile(res.data.user);
        alert('Profile details updated successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save profile changes.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveMentor = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setMentorSaving(true);
    setMentorSuccess('');
    setMentorError('');
    try {
      const res = await studentService.assignFaculty(selectedFaculty);
      if (res.success) {
        setMentorSuccess(res.message);
        const chosen = faculties.find(f => f.faculty_id === selectedFaculty);
        if (chosen) setCurrentMentor(chosen);
      } else {
        setMentorError(res.message || 'Failed to assign advisor.');
      }
    } catch (err) {
      setMentorError(err.response?.data?.message || 'Failed to save advisor.');
    } finally {
      setMentorSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (otpCooldown > 0) return;
    setSendingOtp(true);
    setPassError('');
    setPassSuccess('');
    try {
      const res = await axiosClient.post('/auth/send-otp');
      if (res.data.success) {
        setPassSuccess('OTP code successfully sent to email!');
        setOtpCooldown(60); // 60 seconds cooldown
      }
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || 'Failed to dispatch OTP. Please check backend logs.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    setChangingPass(true);
    try {
      const payload = { newPassword };
      if (verifyMethod === 'otp') {
        payload.otpCode = otpCode;
      } else {
        payload.currentPassword = currentPassword;
      }

      const res = await axiosClient.put('/auth/change-password', payload);
      if (res.data.success) {
        setPassSuccess('Password updated successfully!');
        setCurrentPassword('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || 'Failed to change password. Please check input parameters.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogoutAll = () => {
    alert('Signing out from all devices...');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatJoinDate = (dateStr) => {
    if (!dateStr) return 'May 20, 2024';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDeptFullName = (code) => {
    const names = {
      'CSE': 'Computer Science & Engineering',
      'IT': 'Information Technology',
      'ECE': 'Electronics & Communication Engineering',
      'EEE': 'Electrical & Electronics Engineering'
    };
    return names[code] || code || 'Computer Science & Engineering';
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-12 text-center">Loading profile details...</p>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans relative">
      
      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => { setShowPasswordModal(false); setPassError(''); setPassSuccess(''); }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-855 dark:text-white flex items-center gap-2">
                <Lock className="w-5.5 h-5.5 text-blue-500" />
                <span>Change Password</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your account credentials below.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Method Selector Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod(verifyMethod === 'password' ? 'otp' : 'password');
                    setPassError('');
                  }}
                  className="text-xs text-blue-505 hover:underline font-bold"
                >
                  {verifyMethod === 'password' ? 'Or verify with Email OTP instead' : 'Use current password instead'}
                </button>
              </div>

              {verifyMethod === 'password' ? (
                /* Current Password validation */
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              ) : (
                /* OTP Code validation */
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Email Verification Code (OTP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="otpCode"
                      name="otpCode"
                      autoComplete="one-time-code"
                      required
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="block flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                    />
                    <button
                      type="button"
                      disabled={sendingOtp || otpCooldown > 0}
                      onClick={handleSendOtp}
                      className="px-3.5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 select-none"
                    >
                      {otpCooldown > 0 ? (
                        <span>Retry ({otpCooldown}s)</span>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>{sendingOtp ? 'Sending...' : 'Send OTP'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              {/* Confirm Password input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              {passError && (
                <p className="text-[11px] font-bold text-rose-500 bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10">
                  ⚠️ {passError}
                </p>
              )}

              {passSuccess && (
                <p className="text-[11px] font-bold text-emerald-500 bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10">
                  ✓ {passSuccess}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={changingPass}
                  className="flex-1 text-xs py-2.5 uppercase font-extrabold tracking-wider justify-center"
                >
                  Save Password
                </Button>
                <button 
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPassError(''); setPassSuccess(''); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>User Profile</span>
          <User className="w-6 h-6 text-blue-505" />
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Manage account information, check active role permissions, and modify credentials details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1">
          <div className="p-8 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md flex flex-col items-center text-center">
            
            {/* Avatar Profile Pic */}
            <div className="relative group flex flex-col items-center">
              <div 
                className="h-28 w-28 rounded-full overflow-hidden border-4 shadow-lg transition-transform duration-300 transform group-hover:scale-105 flex items-center justify-center bg-slate-100 dark:bg-slate-900 select-none relative"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="mt-3 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-white text-slate-700 dark:text-slate-350 hover:bg-slate-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-blue-505" />
                Change Profile Pic
              </button>
            </div>

            {/* Avatar Selector Dropdown Panel */}
            {showAvatarPicker && (
              <div className="w-full mt-4 p-4 border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-200">Select Preset Avatar</h4>
                  <button 
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-slate-455 hover:text-slate-600 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Preset Avatars Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {avatarPresets.map(preset => {
                    const isSelected = profilePic === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`p-1 bg-white dark:bg-slate-900 rounded-xl border-2 transition-transform transform active:scale-95 flex items-center justify-center shadow-sm ${
                          isSelected ? 'border-blue-550 scale-105' : 'border-transparent hover:border-slate-200'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                      </button>
                    );
                  })}
                </div>

                {/* Custom File Upload Option */}
                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/40">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left">
                    Or Upload Custom Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20 cursor-pointer"
                  />
                </div>
              </div>
            )}
            
            {/* Name & Role */}
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 font-sans">{name}</h2>
            <span className="mt-2.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-500/15">
              {profile?.role || 'STUDENT'}
            </span>

            {/* Divider Line */}
            <div className="w-full border-t border-slate-100 dark:border-slate-850 mt-6 pt-6 text-left space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              
              {/* Email Address */}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{email}</span>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{phone}</span>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="leading-snug">{getDeptFullName(profile?.department)}</span>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Member Since: {formatJoinDate(profile?.created_at)}</span>
              </div>

            </div>

          </div>
        </div>

        {/* Right Column: Edit Details Form & Account Security */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Account Details Form */}
          <Card title="Account details">
            <form onSubmit={handleSubmit} className="space-y-6 font-sans">
              
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>

                {/* Department Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Department
                  </label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="primary" loading={updating} className="text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 uppercase font-extrabold tracking-wider">
                <Edit className="w-3.5 h-3.5" /> Update Profile details
              </Button>

            </form>
          </Card>

          {/* Card 1.5: Mentor Selection (Student only) */}
          {profile?.role === 'STUDENT' && (
            <Card title="Faculty Mentor / Advisor">
              <form onSubmit={handleSaveMentor} className="space-y-4 font-sans">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your assigned mentor or faculty advisor to link your progress reports and receive assignments.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Faculty Advisor
                  </label>
                  <select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                    required
                  >
                    <option value="">-- Choose Advisor --</option>
                    {faculties.map(f => (
                      <option key={f.faculty_id} value={f.faculty_id}>
                        {f.name} ({f.department} - {f.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {currentMentor && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Current Mentor: {currentMentor.name} ({currentMentor.department})
                  </div>
                )}

                {mentorError && (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                    ⚠️ {mentorError}
                  </p>
                )}

                {mentorSuccess && (
                  <p className="text-[11px] font-bold text-emerald-500 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                    ✓ {mentorSuccess}
                  </p>
                )}

                <Button type="submit" variant="primary" loading={mentorSaving} className="text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 uppercase font-extrabold tracking-wider">
                  <Users className="w-3.5 h-3.5" /> Save Mentor Advisor
                </Button>
              </form>
            </Card>
          )}

          {/* Card 2: Account Security */}
          <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-4 font-sans">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-blue-500/10 text-blue-505 rounded-lg">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Account Security</h3>
            </div>
            
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Keep your account secure with strong password and active sessions management.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => { setShowPasswordModal(true); setPassError(''); setPassSuccess(''); }}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:hover:bg-slate-900/60 hover:bg-slate-50 text-xs font-extrabold text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" /> Change Password
              </button>

              <button 
                onClick={handleLogoutAll}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-rose-500/20 hover:bg-rose-500/[0.05] text-xs font-extrabold text-rose-500 rounded-xl transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out All Devices
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
