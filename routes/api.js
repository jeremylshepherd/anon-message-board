/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const Thread = require('../models/Threads');
const Reply = require('../models/Replies');

const handleError = (res, err) => res.status(400).send(`ERROR: ${err}`);

module.exports = function(app) {
  app
    .route('/api/threads/:board')

    .get(async (req, res) => {
      let populateOptions = {
        path: 'replies',
        options: {
          limit: 3,
          sort: {
            created_on: -1
          },
          select: '-delete_password -reported'
        }
      };
      try {
        let threads = await Thread.find({})
          .select('-reported -delete_password')
          .limit(10)
          .sort({ bumped_on: -1 })
          .populate(populateOptions)
          .exec();
        res.json(threads);
      } catch (e) {
        return handleError(res, e);
      }
    })

    .post(async (req, res) => {
      try {
        let thread = await Thread.create({ ...req.body, ...req.params });
        res.json(thread);
      } catch (e) {
        return handleError(res, e);
      }
    })

    .put(async (req, res) => {
      try {
        let thread = await Thread.findOneAndUpdate(
          { _id: req.body.thread_id },
          { $set: { reported: true } }
        ).exec();
        if (!thread) return res.status(400).send('invalid thread id');
        return res.status(200).send('reported');
      } catch (e) {
        return res.status(400).send(`Error: ${e}`);
      }
    })

    .delete(async (req, res) => {
      try {
        let thread = await Thread.findOne({ _id: req.body.thread_id }).exec();
        console.log('DELETE THREAD: ', thread.delete_password === req.body.delete_password);
        if (thread.delete_password !== req.body.delete_password) return res.send('incorrect password');
        let deleted = await Thread.findOneAndDelete({ _id: thread._id }).exec();
        return res.status(200).send('success');
      } catch (e) {
        return res.status(400).send('incorrect password');
      }
    });

  app
    .route('/api/replies/:board')

    .get(async (req, res) => {
      let populateOptions = {
        path: 'replies',
        options: {
          sort: {
            created_on: -1
          },
          select: '-delete_password -reported'
        }
      };
      try {
        let thread = await Thread.findOne({ _id: req.query.thread_id })
          .select('-reported -delete_password')
          .populate(populateOptions)
          .exec();
        res.json(thread);
      } catch (e) {
        return handleError(res, e);
      }
    })

    .post((req, res) => {
      Thread.findOne({ _id: req.body.thread_id }, (err, thread) => {
        if (err) handleError(res, err);
        if (!thread) return res.status(400).send('That thread does not exist');
        let reply = new Reply({
          text: req.body.text,
          thread: thread._id,
          delete_password: req.body.delete_password
        });
        reply.save((err, record) => {
          if (err) handleError(res, err);
          thread.replies.push(reply._id);
          thread.save();
          res.json(record);
        });
      });
    })

    .put(async (req, res) => {
      try {
        let reply = await Reply.findOneAndUpdate(
          { _id: req.body.reply_id },
          { $set: { reported: true } }
        ).exec();
        console.log(reply);
        if (!reply) return res.status(400).send('invalid reply or thread id');
        return res.status(200).send('reported');
      } catch (e) {
        return res.status(400).send(`ERROR: ${e}`);
      }
    })

    .delete(async (req, res) => {
      try {
        let reply = await Reply.findOneAndUpdate(
          {
            _id: req.body.reply_id,
            thread: req.body.thread_id,
            delete_password: req.body.delete_password
          },
          { $set: { text: `[deleted]` } }
        ).exec();
        if (!reply) return res.send('incorrect password');
        return res.status(200).send('success');
      } catch (e) {
        return res.status(400).send('incorrect password');
      }
    });
};
