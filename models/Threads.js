'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
    board: { type: String, required: true },  
    delete_password: { type: String, required: true },  
    replies: [{ type:  Schema.Types.ObjectId, ref: 'Reply' }],
    reported: { type: Boolean, default: false },
    text: { type: String, required: true, unique: true }
  },{
    timestamps: { createdAt: 'created_on', updatedAt: 'bumped_on' }
});

module.exports = mongoose.model('Thread', ThreadSchema);

/*
bumped_on: { type: Date, default: Date.now },
created_on: { type: Date, default: Date.now },
*/