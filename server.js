const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const postRoutes = require('./routes/postRoutes');
const teamRoutes = require("./routes/teamRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


// Default route
app.get('/', (req, res) => {
    res.send('Server Status: Running ✅');
});

// Routes
app.use('/api', contactRoutes);
app.use('/api', blogRoutes);
app.use('/api', postRoutes);
app.use("/api", teamRoutes);




// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
