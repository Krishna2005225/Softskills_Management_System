/*
------------------------------------------------
File: forumRoutes.js
Purpose: Maps Discussion Forum post/comment endpoints.
Dependencies: express, forumController, authMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');

router.get('/posts', protect, forumController.listPosts);
router.post('/posts', protect, forumController.createPost);
router.get('/posts/:postId/comments', protect, forumController.listComments);
router.post('/posts/:postId/comments', protect, forumController.addComment);
router.post('/posts/:postId/like', protect, forumController.likePost);

module.exports = router;
