const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const Nudge = require('./nudge');  

const app = express();
app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect('process.env.MongoURI', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Event Schema
const eventSchema = new mongoose.Schema({
    type: { type: String, default: 'event' },
    uid: { type: Number, required: true },
    name: { type: String, required: true },
    tagline: { type: String, required: true },
    schedule: { type: Date, required: true },
    description: { type: String, required: true },
    files: {
        image: { type: String },
    },
    moderator: { type: String, required: true },
    category: { type: String, required: true },
    sub_category: { type: String, required: true },
    rigor_rank: { type: Number, required: true },
    attendees: [{ type: Number }],
});

const Event = mongoose.model('Event', eventSchema);

app.get('/', (req, res) => {
    res.send('Welcome to the Events API!');
});

// GET: Get an event by ID
app.get('/api/v3/app/events', async (req, res) => {
    const { id, type, limit, page } = req.query;

    try {
        if (id) {
            const event = await Event.findById(id);
            if (!event) return res.status(404).send({ message: 'Event not found' });
            return res.status(200).send(event);
        }

        if (type === 'latest') {
            const events = await Event.find()
                .sort({ schedule: -1 })
                .limit(parseInt(limit) || 5)
                .skip(((parseInt(page) || 1) - 1) * (parseInt(limit) || 5));
            return res.status(200).send(events);
        }

        res.status(400).send({ message: 'Invalid query parameters' });
    } catch (err) {
        res.status(500).send({ message: 'Server error', error: err.message });
    }
});

// POST: Create an event
app.post('/api/v3/app/events', upload.single('image'), async (req, res) => {
    try {
        const eventData = req.body;
        if (req.body.attendees && Array.isArray(req.body.attendees)) {
            eventData.attendees = req.body.attendees.map(Number); 
        }
        if (req.file) {
            eventData.files = { image: req.file.path };
        }
        const event = new Event(eventData);
        await event.save();
        res.status(201).send({ id: event._id });
    } catch (err) {
        res.status(400).send({ message: 'Invalid data', error: err.message });
    }
});

// Nudge 

// POST: Create a nudge for an event
app.post('/api/v3/app/nudges', upload.single('image'), async (req, res) => {
    try {
        const { eventId, title, sendTime, description, invitationText, icon } = req.body;

        const image = req.file ? req.file.path : null;

        // Create the nudge object
        const nudge = new Nudge({
            eventId,
            title,
            image,
            sendTime,
            description,
            // icon,
            invitationText
        });

        await nudge.save();
        res.status(201).send({ id: nudge._id });
    } catch (err) {
        res.status(400).send({ message: 'Invalid data', error: err.message });
    }
});

// GET: Get all nudges for a specific event or by ID
app.get('/api/v3/app/nudges', async (req, res) => {
    const { id, eventId } = req.query;

    try {
        if (id) {
            const nudge = await Nudge.findById(id);
            if (!nudge) return res.status(404).send({ message: 'Nudge not found' });
            return res.status(200).send(nudge);
        }

        if (eventId) {
            const nudges = await Nudge.find({ eventId });
            return res.status(200).send(nudges);
        }

        res.status(400).send({ message: 'Invalid query parameters' });
    } catch (err) {
        res.status(500).send({ message: 'Server error', error: err.message });
    }
});

// PUT: Update an existing nudge by ID
app.put('/api/v3/app/nudges/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // If an image is uploaded, update the file path
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedNudge = await Nudge.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedNudge) return res.status(404).send({ message: 'Nudge not found' });

        res.status(200).send(updatedNudge);
    } catch (err) {
        res.status(400).send({ message: 'Invalid data', error: err.message });
    }
});

// DELETE: Delete a nudge by ID
app.delete('/api/v3/app/nudges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNudge = await Nudge.findByIdAndDelete(id);
        if (!deletedNudge) return res.status(404).send({ message: 'Nudge not found' });

        res.status(200).send({ message: 'Nudge deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Server error', error: err.message });
    }
});

// Start the server
const PORT =  process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
