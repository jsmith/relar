const fs = require("fs");
const getMP3Duration = require("./get-mp3-duration");
const buffer = fs.readFileSync("assets/file_with_artwork.mp3");
const duration = getMP3Duration(buffer);
console.log(duration);
