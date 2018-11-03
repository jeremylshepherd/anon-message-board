const { ipsum01, ipsum02, ipsum03, ipsum04 }  = require('./ipsums');
const Thread = require('../models/Threads');
const Reply  = require('../models/Replies');


module.exports = {
  
  async dropDB() {
    let threads = await Thread.find({}).remove();
    let replies = await Reply.find({}).remove();
  },

  createThreadArray (n) {  
    let arr = [];  
    for(let i = 1; i <= n; i++) {
      let obj = {};
      obj.text = `${i < 10 ? parseInt(`0${i}`) : i}: ${ipsum01}`;
      obj.delete_password = 'pass';
      obj.board = 'test';
      arr.push(obj);
    }
    return arr;
  },

  createReplyArray (id, n) {
    let arr = [];
    for(let i = 1; i <= n; i++) {
      let obj = {};
      obj.text = `${i < 10 ? `0${i}` : i}: ${ipsum02}`;
      obj.delete_password = 'pass';
      obj.thread = id;
      arr.push(obj);
    }
    return arr;
  },
  
  async removeThread(thread) {
    try{
      let delThread = await Thread.findOneAndDelete({ _id: thread._id }).exec();
      let delReplies = await Reply.find({ thread: thread._id }).remove();
    }catch(e) {
      console.log(e);
    }
  }
  
};