const mongoose = require('mongoose');

const nudgeSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    image: { type: String }, 
    sendTime: { type: Date, required: true },
    description: { type: String, required: true },
    // icon: { type: String }, 
    invitationText: { type: String, required: true }
});

const Nudge = mongoose.model('Nudge', nudgeSchema);

module.exports = Nudge;
