const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    owner_id : {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    description: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['not started', 'in progress', 'completed'],
        default: 'not started'
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
},
{    timestamps: true
}
);

module.exports = mongoose.model('Project', ProjectSchema);