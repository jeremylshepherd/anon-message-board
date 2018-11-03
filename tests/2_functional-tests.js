/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Threads');
const Reply = require('../models/Replies');
const ipsums = require('./ipsums');
const { dropDB, createThreadArray, createReplyArray, removeThread } = require('./test-helpers');

const { ipsum01, ipsum02, ipsum03, ipsum04 } = ipsums;

const genData = async () => {
  let arr = [];
  let threadArr = createThreadArray(15);
  let threads = await Thread.insertMany(threadArr);
  threads.forEach(t => (arr = [...arr, ...createReplyArray(t._id, 5)]));
  let replies = await Reply.insertMany(arr);
  for (let i = 0; i < replies.length; i++) {
    for (let j = 0; j < threads.length; j++) {
      if (replies[i].thread == threads[j]._id) {
        let thread = await Thread.findOneAndUpdate(
          { _id: threads[j]._id },
          { $push: { replies: replies[i]._id } }
        ).exec();
      }
    }
  }
};

chai.use(chaiHttp);

suite('Functional Tests', () => {
  suite('API ROUTING FOR /api/threads/:board', () => {
    suiteSetup(() => {
      dropDB();
    });

    suite('POST', () => {
      test('Thread', done => {
        chai
          .request(server)
          .post('/api/threads/board')
          .send({
            text: ipsum01,
            delete_password: 'delete_password'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200, 'Should have a response status of 200');
            assert.equal(res.body.text, ipsum01, `text equal to ${ipsum01}`);
            assert.equal(
              res.body.delete_password,
              'delete_password',
              `delete_board should equal delete_board`
            );
            assert.equal(res.body.board, 'board', `board should equal board`);
            assert.equal(res.body.reported, false, `reported should equal false`);
            assert.property(res.body, 'text');
            assert.property(res.body, 'delete_password');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'replies');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'board');
            assert.isArray(res.body.replies);
            done();
          });
      });

      test('Thread - No Duplicate Thread', done => {
        chai
          .request(server)
          .post('/api/threads/board')
          .send({
            text: ipsum01,
            delete_password: 'delete_password'
          })
          .end((err, res) => {
            assert.equal(res.status, 400, 'Should have a response status of 400');
            assert.notEqual(res.body.text, ipsum01);
            done();
          });
      });

      suiteTeardown(() => {
        dropDB();
      });
    });

    suite('GET', () => {
      test('Get most recent threads', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.equal(res.status, 200, 'Should have a response status of 200');
            assert.isArray(res.body[0].replies);
            assert.equal(res.body.length, 10);
            assert.equal(res.body[0].board, 'test', `test should equal test`);
            assert.notEqual(res.body[0].replies.length, 0, 'Replies should not be empty');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'replies');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'board');
            assert.isArray(res.body[0].replies);
            done();
          });
      });

      suiteSetup(async () => {
        let data = await genData();
        console.log('Data generated');
      });

      suiteTeardown(() => dropDB());
    });

    suite('DELETE', async () => {
      let thread = await Thread.create({
        text: `DELETE: ${ipsum03.slice(0, 15)}`,
        delete_password: 'pass',
        board: 'delete'
      });

      test('DELETE request to /api/threads/{board} with wrong password', done => {
        chai
          .request(server)
          .delete('/api/threads/delete')
          .send({ thread_id: thread._id, delete_password: 'wrong' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });

      test('DELETE A THREAD COMPETELY "success")', done => {
        chai
          .request(server)
          .delete('/api/threads/delete')
          .send({ thread_id: thread._id, delete_password: 'pass' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });

    suite('PUT', () => {
      test('PUT - REPORT a Thread', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end((err, parRes) => {
            chai
              .request(server)
              .put('/api/threads/test')
              .send({ thread_id: parRes.body[0]._id })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
              });
          });
      });

      test('PUT - missing thread_id', done => {
        chai
          .request(server)
          .get('/api/thread/test')
          .end((err, parRes) => {
            chai
              .request(server)
              .put('/api/threads/test')
              .end((err, res) => {
                assert.equal(res.status, 400);
                assert.equal(res.text, 'invalid thread id');
                done();
              });
          });
      });

      suiteSetup(async () => {
        let data = await genData();
        console.log('Data generated');
      });

      suiteTeardown(() => dropDB());
    });
  });

  suite('API ROUTING FOR /api/replies/:board', () => {
    suite('POST', () => {
      test('Reply', function(done) {
        chai
          .request(server)
          .post('/api/threads/board')
          .send({
            text: ipsum01,
            delete_password: 'delete_password'
          })
          .end(function(err, parRes) {
            chai
              .request(server)
              .post('/api/replies/board')
              .send({
                thread_id: parRes.body._id,
                text: ipsum02,
                delete_password: 'reply_password'
              })
              .end(function(err, res) {
                assert.equal(res.status, 200, 'Should have a response status of 200');
                assert.equal(res.body.text, ipsum02, `text equal to ${ipsum02}`);
                assert.equal(
                  res.body.delete_password,
                  'reply_password',
                  `delete_board should equal reply_board`
                );
                assert.equal(
                  res.body.thread,
                  parRes.body._id,
                  `thread should equal ${parRes.body._id}`
                );
                assert.equal(res.body.reported, false, `reported should equal false`);
                assert.property(res.body, 'text');
                assert.property(res.body, 'delete_password');
                assert.property(res.body, 'created_on');
                assert.property(res.body, 'thread');
                done();
              });
          });
      });

      suiteSetup(() => {
        dropDB();
      });

      teardown(() => {
        dropDB();
      });
    });

    suite('GET', () => {
      test('GET Thread and all replies', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end((err, parRes) => {
            chai
              .request(server)
              .get(`/api/replies/test`)
              .query({ thread_id: parRes.body[0]._id })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.property(res.body, 'text');
                assert.property(res.body, 'replies');
                assert.property(res.body, '_id');
                assert.isArray(res.body.replies);
                assert.equal(res.body.replies.length, 5);
                done();
              });
          });
      });

      suiteSetup(async () => {
        let data = await genData();
        console.log('Data generated');
      });

      suiteTeardown(() => dropDB());
    });

    suite('PUT', () => {
      test('PUT - report reply ', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end((err, parRes) => {
            chai
              .request(server)
              .put('/api/replies/test')
              .send({
                thread_id: parRes.body[0]._id,
                reply_id: parRes.body[0].replies[0]._id
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
              });
          });
      });

      test('PUT - report reply - invalid reply id ', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end((err, parRes) => {
            chai
              .request(server)
              .put('/api/replies/test')
              .send({
                thread_id: parRes.body[0]._id,
                reply_id: (parRes.body[0].replies[0]._id).split('').reverse().join('')
              })
              .end((err, res) => {
                assert.equal(res.status, 400);
                assert.equal(res.text, 'invalid reply or thread id');
                done();
              });
          });
      });

      suiteSetup(async () => {
        let data = await genData();
        console.log('Data generated');
      });

      suiteTeardown(() => dropDB());
    });

    suite('DELETE', () => {
      test('DELETE reply from thread', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end(async (err, parRes) => {
            let thread = await Thread.findOne({ _id: parRes.body[0]._id }).exec();
            let reply = await Reply.findOne({ _id: thread.replies[0]._id }).exec();
            chai
              .request(server)
              .delete('/api/replies/test')
              .send({
                thread_id: thread._id,
                reply_id: reply._id,
                delete_password: reply.delete_password
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
              });
          });
      });

      test('DELETE reply from thread - wrong password', done => {
        chai
          .request(server)
          .get('/api/threads/test')
          .end(async (err, parRes) => {
            let thread = await Thread.findOne({ _id: parRes.body[0]._id }).exec();
            let reply = await Reply.findOne({ _id: thread.replies[0]._id }).exec();
            chai
              .request(server)
              .delete('/api/replies/test')
              .send({
                thread_id: thread._id,
                reply_id: reply._id,
                delete_password: 'wrong'
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
              });
          });
      });

      suiteSetup(async () => {
        let data = await genData();
        console.log('Data generated');
      });

      suiteTeardown(() => dropDB());
    });
  });

  suiteTeardown(() => {
    dropDB();
  });
});
