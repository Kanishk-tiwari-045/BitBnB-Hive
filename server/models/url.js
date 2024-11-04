import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true
    },
    redirectUrl: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['html', 'js', 'jsx', 'ts', 'tsx', 'xlsx', 'py', 'ipynb', 'pdf', 'docx', 'txt', 'png', 'jpg', 'folder'], // Allowed extensions
        required: true
    },
    username: {
        type: String,
        required: true // Set to true if username is mandatory
    },
    status: {
        type: Boolean,
        default: true // 'true' when project is ongoing
    },
    visitHistory: [{
        timestamp: { type: Number }
    }]
}, { timestamps: true });

const URL = mongoose.model('Url', urlSchema);
export default URL;
