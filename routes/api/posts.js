const express = require('express'); 
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Post = require('../../models/Posts')

//validation
const validatePostInput = require('../../validation/post')
//profile model
const Profile = require('../../models/Profile');
//@route    get route api/posts/test 
//@desc     @access public
//@access   Public
router.get('/test', (req, res) => res.json({msg:"post works"}));
//@route    get route api/posts 
//@desc      get all post
//@access   public
router.get('/', (req, res) => {
    Post.find()
        .sort({date: -1})
        .then(posts => res.json(posts))
        .catch(err =>res.status(404).json({nopostsfound:'noPosts found'}))
})
//@route    get route api/posts /:id
//@desc      get post by id
//@access   public
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err =>res.status(404).json({nopostfound:'no post found with that id'}))
})
//@route    post route api/posts 
//@desc      create post
//@access   private
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      const { errors, isValid } = validatePostInput(req.body);
  
      // Check Validation
      if (!isValid) {
        // If any errors, send 400 with errors object
        return res.status(400).json(errors);
      }
  
      const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      });
  
      newPost.save().then(post => res.json(post));
    }
  );
//@route    delete route api/posts /:id
//@desc      delete post by id
//@access   private
router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            // Check for post owner
            if (post.user.toString() !== req.user.id) {
              return res
                .status(401)
                .json({ notauthorized: 'User not authorized' });
            }
  
            // Delete
            post.remove().then(() => res.json({ success: true }));
          })
          .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
      })
      .catch(err => res.status(404).json({ usernotfound: 'user not found' }));
      
    }
  );
//@route    post route api/posts /like/:id
//@desc      like post
//@access   private
router.post(
    '/like/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (
              post.likes.filter(like => like.user.toString() === req.user.id)
                .length > 0
            ) {
              return res
                .status(400)
                .json({ alreadyliked: 'User already liked this post' });
            }
  
            // Add user id to likes array
            post.likes.unshift({ user: req.user.id });
  
            post.save().then(post => res.json(post));
          })
          .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
      })
      .catch(err => res.status(404).json(err));
    }
  );
  //@route    post route api/posts /unlike/:id
//@desc      unlike post
//@access   private
router.post(
    '/unlike/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (
              post.likes.filter(like => like.user.toString() === req.user.id)
                .length === 0
            ) {
              return res
                .status(400)
                .json({ notliked: 'notliked yet' });
            }
  
            // get remove index
           const removeIndex = post.likes
                    .map(item => item.user.toString())
                    .indexOf(req.user.id)
            // splice out of array
            post.likes.splice(removeIndex, 1)
            //save
            post.save().then(post => res.json(post))
          })
          .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
      })
      .catch(err => res.status(404).json(err));
    }
  );
//@route    post route api/posts /comment/:id
//@desc      add comment to a post
//@access   private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
      // Check Validation
      if (!isValid) {
        // If any errors, send 400 with errors object
        return res.status(400).json(errors);
      }

    Post.findById(req.params.id)
    .then(post => {
    const newComment = {
      text:req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    }
    //add to comment
    post.comments.unshift(newComment);
    //save 
    post.save().then(post => res.json(post))
    })
    .catch(err => res.status(404).json(err));
  }
);
//@route    delete route api/posts/comment/:id/:comment_id
//@desc     delete a comment 
//@access   private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
    .then(post => {
    //check if comment exits
    if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0)
    {return res.status(404).json({commentnotexists:'comment does not exit'})}
    //get remove index
    const removeIndex = post.comments 
      .map(item => item._id.toString())
      .indexOf(req.params.comment_id);
      //splice comment
      post.comments.splice(removeIndex, 1);
      post.save().then(post => res.json(post))

    })
    .catch(err => res.status(404).json(err));
  }
);
module.exports = router;