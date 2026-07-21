/*
------------------------------------------------
File: forumController.js
Purpose: Handles discussion forums threads and messages.
Responsibilities: Lists threads, logs post creations, and registers comments.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  GET /api/forum/posts
  Returns list of forum posts.
  */
  listPosts: async (req, res, next) => {
    try {
      const postsRes = await db.query(
        `SELECT fp.*, u.name as "authorName", u.role as "authorRole", u.department as "authorDepartment", s.year as "authorYear"
         FROM forum_posts fp
         JOIN users u ON fp.created_by = u.user_id
         LEFT JOIN students s ON fp.created_by = s.student_id
         ORDER BY fp.created_at DESC`
      );

      const fallbackPosts = [
        {
          post_id: 'post-1',
          title: 'How to prepare for Google HR interview questions?',
          content: 'I have an upcoming Google interview next week. What soft skills are they checking most?',
          likes: 4,
          views: 45,
          category: 'Soft Skills',
          tags: 'Google, HR, Interview',
          authorName: 'Krishna',
          authorRole: 'STUDENT',
          authorDepartment: 'CSE',
          authorYear: 3,
          created_at: new Date()
        }
      ];

      return res.status(200).json({
        success: true,
        posts: postsRes.rows.length > 0 ? postsRes.rows : fallbackPosts
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/forum/posts
  Creates a new forum discussion thread.
  */
  createPost: async (req, res, next) => {
    try {
      const { title, content, category = 'General', tags = '' } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required.' });
      }

      const newPostRes = await db.query(
        `INSERT INTO forum_posts (title, content, created_by, category, tags)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
         [title, content, req.user.user_id, category, tags]
      );

      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post: newPostRes.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/forum/posts/:postId/comments
  Lists comments matching a discussion thread.
  */
  listComments: async (req, res, next) => {
    try {
      const { postId } = req.params;
      
      const commentsRes = await db.query(
        `SELECT fc.*, u.name as "authorName"
         FROM forum_comments fc
         JOIN users u ON fc.created_by = u.user_id
         WHERE fc.post_id = $1
         ORDER BY fc.created_at ASC`,
        [postId]
      );

      return res.status(200).json({
        success: true,
        comments: commentsRes.rows
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/forum/posts/:postId/comments
  Logs a comment response.
  */
  addComment: async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Comment content is required.' });
      }

      const commentRes = await db.query(
        `INSERT INTO forum_comments (post_id, content, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [postId, content, req.user.user_id]
      );

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: commentRes.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/forum/posts/:postId/like
  Increments a forum post's likes.
  */
  likePost: async (req, res, next) => {
    try {
      const { postId } = req.params;
      const resLike = await db.query(
        `UPDATE forum_posts 
         SET likes = COALESCE(likes, 0) + 1 
         WHERE post_id = $1 
         RETURNING likes`,
        [postId]
      );
      return res.status(200).json({
        success: true,
        likes: resLike.rows[0]?.likes || 0
      });
    } catch (error) {
      return next(error);
    }
  }
};
