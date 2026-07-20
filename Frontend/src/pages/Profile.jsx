/*
------------------------------------------------
File: Profile.jsx
Purpose: Authenticated profile update page.
Responsibilities: Logs profile changes, commits updates to backend servers.
Dependencies: react, useAuth, authService, Card, Button
------------------------------------------------
*/

/*
------------------------------------------------
File: Profile.jsx
Purpose: Authenticated profile update page.
Responsibilities: Logs profile changes, commits updates to backend servers.
Dependencies: react, axiosClient, Card, Button
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Mail, GraduationCap, Award, Calendar, BarChart2 } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [rollNo, setRollNo] = useState('');
  const [year, setYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [claiming, setClaiming] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/auth/profile');
      if (res.data.success) {
        const u = res.data.user;
        setProfile(u);
        setName(u.name || '');
        setDepartment(u.department || 'CSE');
        setRollNo(u.roll_no || '');
        setYear(u.year || '');
        setCgpa(u.cgpa || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await axiosClient.get('/certificates');
      if (res.data.success) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCertificates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axiosClient.put('/auth/profile', {
        name,
        department,
        roll_no: rollNo,
        year: parseInt(year) || null,
        cgpa: parseFloat(cgpa) || null
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

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await axiosClient.post('/certificates/claim');
      if (res.data.success) {
        alert(res.data.message);
        fetchCertificates();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim certificate.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-6 text-center">Loading profile details...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">User Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage account information, check active role permissions, and modify credentials details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left card: Summary Card */}
        <Card className="flex flex-col items-center text-center p-8 h-fit">
          <div className="h-24 w-24 bg-blue-600 text-white text-3xl font-extrabold rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            {name.charAt(0)}
          </div>
          <h2 className="font-extrabold text-xl">{name}</h2>
          <span className="mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-lg uppercase tracking-wider text-slate-500">
            {profile?.role || 'STUDENT'}
          </span>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-6 pt-6 text-left space-y-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Department: {profile?.department}</span>
            </div>
            {profile?.role === 'STUDENT' && (
              <>
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>CGPA Rating: {profile?.cgpa || '0.0'}</span>
                </div>
                <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Readiness: {profile?.placement_score || '0'}%</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Right card: Input Details Form */}
        <Card title="Account details" className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                </select>
              </div>
            </div>

            {profile?.role === 'STUDENT' && (
              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase">Roll Number</label>
                  <input 
                    type="text" 
                    value={rollNo} 
                    onChange={(e) => setRollNo(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase">Graduation Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase">Current CGPA</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa} 
                    onChange={(e) => setCgpa(e.target.value)} 
                    required 
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" variant="primary" loading={updating} className="px-8 text-xs font-bold">
                Update Profile details
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Certificates section */}
      {profile?.role === 'STUDENT' && (
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <Card title="Verified Claims & Awards" className="md:col-span-3">
            {certificates.length > 0 ? (
              <div className="space-y-6 max-w-2xl">
                {certificates.map((cert) => (
                  <div key={cert.certificate_id} className="p-8 border-4 border-double border-amber-500 rounded-3xl bg-amber-50/10 dark:bg-amber-950/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-2">
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-bold tracking-wider uppercase">
                        Verified Claim
                      </span>
                      <h3 className="text-lg font-extrabold text-amber-700 dark:text-amber-400 font-sans mt-2">Placement Readiness Certificate</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">This certifies that <strong>{name}</strong> has achieved the required placement index in soft skills modules.</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-2 font-bold">Verification ID: {cert.verification_hash}</p>
                    </div>

                    <div className="shrink-0 flex flex-col items-center gap-2">
                      {/* QR Code SVG */}
                      <svg width="80" height="80" viewBox="0 0 29 29" fill="none" className="bg-white p-1.5 rounded-xl shadow border border-slate-100">
                        <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm2 2h1v1H3V3zm18-3h7v7h-7V0zm1 1v5h5V1h-5zm2 2h1v1h-1V3zM0 22h7v7H0v-7zm1 1v5h5v-5H1zm2 2h1v1H3v-1zm13-13v2h2v-2h-2zm4 0v2h2v-2h-2zm-2 2v2h2v-2h-2zm4 0v2h2v-2h-2zm-4 4v2h2v-2h-2zm2 2v2h2v-2h-2zm-6 2v2h2v-2h-2zm6 0v2h2v-2h-2z" fill="#000"/>
                        <path d="M9 1h1v1H9V1zm2 1h1v1h-1V2zm0 2h1v1h-1V4zm-2 1h1v1H9V5zm4-4h1v1h-1V1zm1 2h1v1h-1V3zm-2 2h1v1h-1V5zm9 5h1v1h-1v-1zm0 2h1v1h-1v-1zm-2-1h1v1h-1v-1zm-2 2h1v1h-1v-1zm3 2h1v1h-1v-1zm-2 1h1v1h-1v-1z" fill="#000"/>
                      </svg>
                      <span className="text-[8px] font-bold font-mono text-slate-400 uppercase">Scan to Verify</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-xs text-slate-400">You haven't claimed any certificates yet.</p>
                {profile?.placement_score >= 80 ? (
                  <Button 
                    onClick={handleClaim} 
                    loading={claiming}
                    variant="primary" 
                    className="text-xs font-bold px-6 bg-amber-600 hover:bg-amber-700"
                  >
                    Claim Placement Readiness Certificate
                  </Button>
                ) : (
                  <p className="text-xs font-bold text-rose-500">Achieve a placement readiness score of 80% or more to unlock certificate claims. (Current Score: {profile?.placement_score}%)</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;

