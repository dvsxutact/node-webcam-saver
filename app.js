const path = require("path");
const readline = require("readline");
const webcam = require("node-webcam");
const fs = require("fs");

const configFilePath = "config.json";
const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
const captureFolder = path.join(__dirname, "images", config.project_name);

  // Start a counter to track the number of images we've taken
  let imgCount = 0;

// Ensure the capture folder exists
if (!fs.existsSync(captureFolder)) {
  fs.mkdirSync(captureFolder, { recursive: true });
}

try {
  console.log("Starting up");

  console.log("Loading Configuration");
  console.log('Saving Images to: ' + captureFolder);

  console.log('Checking last image number');
  var imgCountValues = [];
  fs.readdirSync(captureFolder).forEach(file => {
    var imgNum = file.split('_')[1];
    imgCountValues.push(imgNum);
  });

  let lastImgNum = imgCountValues[imgCountValues.length - 1]
  imgCount = ++lastImgNum;
  console.log('Next Image Number: ' + imgCount);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  // Set up webcam options
  const webcamOptions = {
    width: 1280,
    height: 1024,
    quality: 100,
    delay: 0,
    output: "png",
    callbackReturn: "base64",
    device: false,
    verbose: false,
  };

  // Create webcam instance
  console.log("Starting Webcam");
  const cam = webcam.create(webcamOptions);

  console.log("Start Listening for keypress");
  console.log('Press 0 to capture image, Press "q" to quit');
  process.stdin.on("keypress", (chunk, key) => {
    if (key && key.name == "q") {
      process.exit();
    }

    if (key && key.name === "0") {
      console.log("Capturing image");
      // Capture image from webcam
      const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-");
      const imageName = `timelapse_${imgCount}_${timestamp}.png`;
  
      cam.capture(`${captureFolder}/${imageName}`, (err, data) => {
        if (err) {
          console.error("Error capturing image:", err);
        } else {
          console.log("Image captured and saved successfully:", imageName);
        }
      });
      imgCount++;
    }

  });
} catch (err) {
  console.error(err);
}