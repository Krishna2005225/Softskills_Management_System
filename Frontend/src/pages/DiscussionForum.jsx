/*
------------------------------------------------
File: DiscussionForum.jsx
Purpose: Renders student and faculty discussion boards.
Responsibilities: Lists discussion threads, submits thread answers, manages bookmarks, and displays live online users chat.
Dependencies: react, axiosClient, Card, Button, Toast
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  MessageSquare, 
  ThumbsUp, 
  PlusCircle, 
  Bookmark, 
  Eye, 
  MoreHorizontal, 
  Filter, 
  HelpCircle, 
  Lightbulb, 
  Send,
  User
} from 'lucide-react';

const DiscussionForum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Coding Help');
  const [newTags, setNewTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Independent state per post for comments and comment inputs
  const [postComments, setPostComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // --- LIVE COMMUNITY CHAT STATES ---
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveInput, setLiveInput] = useState('');
  const liveChatEndRef = useRef(null);

  const handleLikePost = async (e, postId) => {
    e.stopPropagation();
    try {
      const res = await axiosClient.post(`/forum/posts/${postId}/like`);
      if (res.data.success) {
        setPosts(prev => prev.map(post => {
          const pid = post.post_id || post.id;
          if (pid === postId) {
            return { ...post, likes: res.data.likes };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleBookmarkPost = (e, postId) => {
    e.stopPropagation();
    setBookmarks(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const loadPosts = async () => {
    try {
      const res = await axiosClient.get('/forum/posts');
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // --- Live Community Chat Setup ---
  useEffect(() => {
    // Initial seeded chat messages
    setLiveMessages([
      { id: 1, sender: 'Siddharth Verma', avatar: 'SV', bg: 'bg-blue-500/10 text-blue-500', content: 'Hey guys! Anyone practicing for the mock GD session tonight?', time: '12:35 PM' },
      { id: 2, sender: 'Riya Patel', avatar: 'RP', bg: 'bg-purple-500/10 text-purple-500', content: 'Count me in! The AI prompt engineering topic looks interesting.', time: '12:36 PM' }
    ]);

    const randomMessages = [
      { sender: 'Aarav Sharma', content: 'Just got an 88% on my latest Mock Interview assessment! The AI coach suggestions are really helpful.' },
      { sender: 'Trainer Srinivas', content: 'Friendly reminder to all students: please complete your assigned resume drafts by Friday evening.' },
      { sender: 'Siddharth Verma', content: 'Does anyone have a good resource for practicing puzzle-based coding questions?' },
      { sender: 'Riya Patel', content: 'Just uploaded my resume. The ATS scorer recommended adding more quantitative achievements, which raised my score to 85%.' },
      { sender: 'Aarav Sharma', content: 'Let’s organize a group study session in the library for the aptitude round tomorrow.' }
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      if (msgIdx < randomMessages.length) {
        const nextMsg = randomMessages[msgIdx];
        const { initials, bg, text } = getAvatarDetails(nextMsg.sender);
        setLiveMessages(prev => [
          ...prev,
          {
            id: Date.now() + msgIdx,
            sender: nextMsg.sender,
            avatar: initials,
            bg: `${bg} ${text}`,
            content: nextMsg.content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        msgIdx++;
      }
    }, 15000); // simulate a chat message every 15s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (liveChatEndRef.current) {
      liveChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages]);

  const handleSendLiveMessage = (e) => {
    e.preventDefault();
    if (!liveInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'Krishna (You)',
      avatar: 'K',
      bg: 'bg-blue-600 text-white font-bold',
      content: liveInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLiveMessages(prev => [...prev, userMsg]);
    setLiveInput('');

    // Trigger simulated reply from another active student
    setTimeout(() => {
      const replies = [
        'Awesome point, @Krishna!',
        'Thanks for sharing that, Krishna. It makes a lot of sense.',
        'Exactly! That aligns with what Professor Srinivas was saying.',
        'Great, let’s sync up on this in the practice lobby later.'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const responders = ['Siddharth Verma', 'Riya Patel', 'Aarav Sharma'];
      const pickedResponder = responders[Math.floor(Math.random() * responders.length)];
      const avatar = getAvatarDetails(pickedResponder);

      setLiveMessages(prev => [
        ...prev,
        {
          id: Date.now() + 99,
          sender: pickedResponder,
          avatar: avatar.initials,
          bg: `${avatar.bg} ${avatar.text} font-bold`,
          content: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await axiosClient.post('/forum/posts', {
        title: newTitle,
        content: newContent,
        category: newCategory,
        tags: newTags
      });
      if (res.data.success) {
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        loadPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPost = async (post) => {
    const pid = post.post_id || post.id;
    const isAlreadySelected = selectedPost?.post_id === pid;
    
    if (isAlreadySelected) {
      setSelectedPost(null);
      return;
    }

    setSelectedPost(post);
    try {
      const res = await axiosClient.get(`/forum/posts/${pid}/comments`);
      if (res.data.success) {
        setPostComments(prev => ({
          ...prev,
          [pid]: res.data.comments
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const text = commentTexts[postId] || '';
    if (!text.trim()) return;

    try {
      const res = await axiosClient.post(`/forum/posts/${postId}/comments`, {
        content: text
      });
      if (res.data.success) {
        // Clear input for this post
        setCommentTexts(prev => ({
          ...prev,
          [postId]: ''
        }));
        // Reload comments for this post
        const commentsRes = await axiosClient.get(`/forum/posts/${postId}/comments`);
        if (commentsRes.data.success) {
          setPostComments(prev => ({
            ...prev,
            [postId]: commentsRes.data.comments
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAvatarDetails = (name) => {
    if (!name) return { initials: 'U', bg: 'bg-slate-500/10', text: 'text-slate-400' };
    const split = name.split(' ');
    const initials = split.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Consistent color mapping based on name
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = [
      { bg: 'bg-orange-500/10', text: 'text-orange-500' },
      { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      { bg: 'bg-purple-500/10', text: 'text-purple-500' }
    ];
    const picked = colors[charCodeSum % colors.length];
    return { initials, bg: picked.bg, text: picked.text };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const filteredPosts = posts.filter(post => 
    filterCategory === 'All' || post.category === filterCategory
  );

  const categories = ['Coding Help', 'Soft Skills', 'Placements', 'General'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white flex items-center gap-2">
          Discussion Forum <MessageSquare className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Share programming hacks, ask soft skills guidance questions, and exchange feedback with faculty coaches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Community Board Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card 
            title="Community Board Feed" 
            headerAction={
              <div className="relative">
                <button 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-slate-200/50 dark:border-slate-700/50"
                >
                  <Filter className="w-3.5 h-3.5" /> Filter ({filterCategory})
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden">
                    <button 
                      onClick={() => { setFilterCategory('All'); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold ${filterCategory === 'All' ? 'bg-blue-500/10 text-blue-500' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => { setFilterCategory(cat); setShowFilterMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold ${filterCategory === cat ? 'bg-blue-500/10 text-blue-500' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            {loading ? (
              <p className="text-xs text-slate-400 py-12 text-center">Loading discussions...</p>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const pid = post.post_id || post.id;
                  const { initials, bg, text } = getAvatarDetails(post.authorName);
                  const isSelected = selectedPost && selectedPost.post_id === pid;
                  const currentComments = postComments[pid] || [];
                  const currentCommentText = commentTexts[pid] || '';
                  
                  return (
                    <div 
                      key={pid} 
                      onClick={() => handleSelectPost(post)}
                      className={`p-5 border rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/[0.03] shadow-md shadow-blue-500/5'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                      }`}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-xs shadow-inner`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{post.authorName}</h4>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {post.authorRole === 'STUDENT' 
                                  ? `${post.authorYear ? `${post.authorYear}st` : '3rd'} Year, ${post.authorDepartment || 'CSE'}`
                                  : `${post.authorRole === 'FACULTY' ? 'Faculty Coach' : 'Placement Team'}`
                                }
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              {formatTime(post.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Category Tag */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          post.category === 'Coding Help' 
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                            : post.category === 'Soft Skills' 
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : post.category === 'Placements'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {post.category || 'General'}
                        </span>
                      </div>

                      {/* Post Content */}
                      <div className="mt-3">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-blue-500 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* Tags */}
                      {post.tags && (
                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                          {post.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50 dark:border-slate-800/50 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={(e) => handleLikePost(e, pid)}
                            className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> {post.likes || 0}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSelectPost(post); }}
                            className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> {post.likes ? Math.floor(post.likes * 0.7) : 0}
                          </button>
                          <span className="flex items-center gap-1 cursor-default">
                            <Eye className="w-3.5 h-3.5" /> {post.views || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => handleBookmarkPost(e, pid)}
                            className="hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarks[pid] ? 'text-blue-500 fill-blue-500' : ''}`} />
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Comments Section inside the Post Card */}
                      {isSelected && (
                        <div className="mt-5 pt-4 border-t border-slate-100/80 dark:border-slate-800/80 space-y-4" onClick={(e) => e.stopPropagation()}>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            Comments
                          </h4>
                          
                          {/* Comments List */}
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {currentComments.length > 0 ? (
                              currentComments.map((comm) => {
                                const commAvatar = getAvatarDetails(comm.authorName);
                                return (
                                  <div key={comm.comment_id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`w-5 h-5 rounded-full ${commAvatar.bg} ${commAvatar.text} flex items-center justify-center font-bold text-[8px]`}>
                                        {commAvatar.initials}
                                      </div>
                                      <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300">{comm.authorName}</span>
                                      <span className="text-[8px] text-slate-400">{formatTime(comm.created_at)}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-7">{comm.content}</p>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[10px] text-slate-400 text-center py-4">No comments yet. Be the first to reply!</p>
                            )}
                          </div>

                          {/* Add Comment Input */}
                          <form onSubmit={(e) => handleAddComment(e, pid)} className="flex gap-2 mt-3">
                            <input
                              type="text"
                              required
                              value={currentCommentText}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [pid]: e.target.value }))}
                              placeholder="Write a constructive response..."
                              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 bg-transparent rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200"
                            />
                            <Button type="submit" variant="primary" className="text-xs px-3 py-1.5 h-auto">
                              <Send className="w-3 h-3 mr-1" /> Reply
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center">No discussion posts in this category. Create the first one!</p>
            )}
          </Card>
        </div>

        {/* Right Column: Start Discussion Form, Live Community Chat & Guidelines */}
        <div className="space-y-6">
          <Card title="Start Discussion">
            <form onSubmit={handleCreatePost} className="space-y-4 font-sans">
              {/* Discussion Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Preparing for coding tests"
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Category Select Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Choose Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isActive = newCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          isActive
                            ? 'bg-blue-600/10 text-blue-500 border-blue-500/50 shadow-sm shadow-blue-500/5'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Post Content */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Post Content Details
                </label>
                <textarea
                  rows="4"
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Describe your inquiry questions or programming updates..."
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>

              {/* Optional Tags */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Add Tags (optional)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="e.g., JavaScript, Arrays, Resume"
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="primary" loading={submitting} className="w-full justify-center text-xs py-2.5 rounded-xl">
                <PlusCircle className="w-4 h-4 mr-1.5" /> Create Thread Post
              </Button>
            </form>
          </Card>

          {/* Card: Live Community Chat */}
          <Card 
            title="Live Community Chat"
            headerAction={
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>12 Online</span>
              </div>
            }
          >
            <div className="space-y-4 font-sans flex flex-col h-[280px]">
              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                {liveMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold ${msg.bg}`}>
                      {msg.avatar}
                    </div>
                    <div className="space-y-0.5 max-w-[85%]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[10px] text-slate-700 dark:text-slate-350">{msg.sender}</span>
                        <span className="text-[8px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-normal p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={liveChatEndRef} />
              </div>

              {/* Message Send Form */}
              <form onSubmit={handleSendLiveMessage} className="pt-3 border-t border-slate-100 dark:border-slate-900 flex gap-2 shrink-0">
                <input
                  type="text"
                  required
                  value={liveInput}
                  onChange={e => setLiveInput(e.target.value)}
                  placeholder="Ask the active student community..."
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 font-semibold"
                />
                <Button type="submit" variant="primary" className="text-xs px-3 py-1.5 h-auto">
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>
          </Card>

          {/* Bottom Guidelines Alert */}
          <div className="p-4 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] border border-amber-500/10 dark:border-amber-500/5 rounded-2xl flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="font-sans">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Be respectful and helpful.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Follow our community guidelines to build a clean workspace.
              </p>
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                className="inline-block text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors mt-2"
              >
                View Guidelines ➜
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DiscussionForum;
