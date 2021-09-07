// Set up constants
const express = require("express");
const app = express();

app.use('/public',express.static(process.cwd() + '/public'));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on Port 3000');
});
