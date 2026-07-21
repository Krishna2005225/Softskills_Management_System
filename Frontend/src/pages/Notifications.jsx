/*
------------------------------------------------
File: Notifications.jsx
Purpose: Real notifications page connected to the backend.
Responsibilities: Fetch live notifications, mark as read, mark all as read, delete.
Dependencies: react, axiosClient, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Bell, MailOpen, AlertCircle, CheckCheck, Trash2,
  Loader2, ClipboardList, Award, Users, Mic, Brain
} from 'lucide-react';

const getRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const getNotifIcon = (message) => {
  const m = message.toLowerCase();
  if (m.includes('task') || m.includes('assigned')) return <ClipboardList className="w-4 h-4" />;
  if (m.includes('evaluated') || m.includes('graded') || m.includes('score')) return <Award className="w-4 h-4" />;
  if (m.includes('batch') || m.includes('faculty') || m.includes('student')) return <Users className="w-4 h-4" />;
  if (m.includes('interview')) return <Mic className="w-4 h-4" />;
  if (m.includes('aptitude') || m.includes('test')) return <Brain className="w-4 h-4" />;
  if (m.includes('overdue')) return <AlertCircle className="w-4 h-4" />;
  return <Bell className="w-4 h-4" />;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await axiosClient.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} — evaluations, tasks, and updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition-colors"
          >
            {markingAll
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCheck className="w-4 h-4" />
            }
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl border border-red-100 dark:border-red-900">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <MailOpen className="w-12 h-12 opacity-30" />
          <p className="font-semibold text-sm">No notifications yet</p>
          <p className="text-xs">You'll be notified when tasks are assigned or evaluated.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.notification_id}
              className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                notif.is_read
                  ? 'border-slate-100 dark:border-slate-800 bg-transparent opacity-80'
                  : 'border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20'
              }`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                notif.is_read
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  : 'bg-blue-500/10 text-blue-600'
              }`}>
                {notif.is_read ? <MailOpen className="w-4 h-4" /> : getNotifIcon(notif.message)}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${
                  notif.is_read
                    ? 'font-medium text-slate-600 dark:text-slate-400'
                    : 'font-bold text-slate-800 dark:text-gray-200'
                }`}>
                  {notif.message}
                </p>
                <span className="text-[10px] text-slate-400 font-bold block mt-1.5">
                  {getRelativeTime(notif.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.notification_id)}
                    title="Mark as read"
                    className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.notification_id)}
                  title="Delete"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
