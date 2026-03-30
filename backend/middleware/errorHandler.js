export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err?.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (err?.code === 11000) {
        return res.status(409).json({ message: 'Duplicate record already exists.' });
    }

    if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Max 5MB allowed.' });
    }

    if (err?.message === 'INVALID_FILE_TYPE') {
        return res.status(415).json({ message: 'Only PDF, JPG, PNG allowed.' });
    }

    console.error('Global Error Handler:', err);
    return res.status(500).json({ message: 'Internal server error.' });
};

