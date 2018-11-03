'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  thread: { type:  Schema.Types.ObjectId, ref: 'Thread' }
});

module.exports = mongoose.model('Reply', ReplySchema);