const path = require("path");
const readline = require("readline");
const webcam = require("node-webcam");
const fs = require("fs");
const mqtt = require("mqtt");
const { default: OBSWebSocket } = require('obs-websocket-js');
//const OBSWebSocket = require('obs-websocket-js').default;
const obsStudio = new OBSWebSocket();

console.log("Starting up");

// Read the config file
console.log("Loading Configuration");
const configFilePath = "config.json";
const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));

// Define our MqttConnection, we will use this later
let mqttConnection = null;

// Connect to MQTT Server (if configured)
if (config.mq_host !== "") {
  (async function () {
    console.log("Connecting to MQTT Server: " + config.mq_host);

    const connectUrl = `mqtt://${config.mq_host}:${config.mq_port}`
    const connection = mqtt.connect(connectUrl, {
      clientId: 'node-webcam-server',
      clean: true,
      connectTimeout: 4000,
      username: config.mq_user,
      password: config.mq_pass,
      reconnectPeriod: 1000,
    });
    mqttConnection = connection;

    const topic = "/node-webcam-saver/mqtt";

    connection.on('connect', () => {
      console.log('mqtt server connected');

      connection.subscribe(topic, () => {
        console.log('subscribed to topic: ' + topic);
      });
    });

    connection.on('message', (topic, payload) => {
      processIncomingMessage(topic, payload);
    });
  })();
}
else {
  console.log("No MQTT Server Configured");
}

// Check if OBS defined
if (config.obs_enabled !== false) {
  console.log('OBS integration is enabled');
  console.log('Attempting to connect to OBS');

  try {
    (async function () {
      const { obsWebSocketVersion, negotiatedRpcVersion } = await obsStudio.connect('ws://localhost:4455', 'abc123');
      console.log(`Connected to OBS Studio: ${obsWebSocketVersion} Using RPC ${negotiatedRpcVersion}`);
    })();

  }
  catch (error) {
    console.log('OBS Connection failed, Error below');
    console.log(error);
    process.exit();
  }
}

// Read the capture folder from the config file
const captureFolder = path.join(__dirname, "images", config.project_name);
console.log("Saving Images to: " + captureFolder);

// Start a counter to track the number of images we've taken
let imgCount = 0;
let newProject = false;

// Ensure the capture folder exists
if (!fs.existsSync(captureFolder)) {
  fs.mkdirSync(captureFolder, { recursive: true });
  newProject = true;
}

try {

  // Check if this is a new project or existing
  console.log('Checking if this is a new project or existing');
  if (newProject) {
    console.log('This is a new project, setting imgCount to zero');
    imgCount = 0;
    console.log("Next Image Number: " + imgCount);
  }
  else {
    console.log("Checking last image number");
    var imgCountValues = [];
    fs.readdirSync(captureFolder).forEach((file) => {
      var imgNum = file.split("_")[1];
      imgCountValues.push(imgNum);
    });

    let lastImgNum = imgCountValues[imgCountValues.length - 1];
    imgCount = ++lastImgNum;
    console.log("Next Image Number: " + imgCount);
  }

  // Verify the imgCount variable is properly set
  console.log(imgCount);
  if (imgCount === undefined || imgCount === null || isNaN(imgCount)) {
    console.log("imgCount is NaN, setting to zero");
    imgCount = 0;
  }

  // Set up keypress events
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

  console.log("Startup Complete");

  console.log('Press 0 to capture image, Press "q" to quit');
  process.stdin.on("keypress", (chunk, key) => {
    if (key && key.name == "q") {
      process.exit();
    }

    if (key && key.name === "0") {

      console.log("Capturing image");

      // Capture image from webcam
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\./g, "-");
      const imageName = `timelapse_${imgCount}_${timestamp}.png`;

      cam.capture(`${captureFolder}/${imageName}`, (err, data) => {
        if (err) {
          console.error("Error capturing image:", err);
        } else {
          if (config.mq_host !== '') {
            const topic = "node-webcam-saver/capture_result";
            const message = `${imageName}`;
            console.log('Publishing to MQTT Server:', topic, message);
            mqttConnection.publish(topic, message);
          }
          console.log("Image captured and saved successfully:", imageName);
        }
      });
      imgCount++;
    }

    // Check if OBS Integration is enabled
    if (config.obs_enabled !== false) {
      // Print current OBS Scene, IF OBS connected
      for (const mapping of config.obs_mapping) {
        if (key && key.name == mapping.keyPressed && mapping.sceneToShow === "list-all") {
          console.log(`Scene To Show: ${mapping.sceneToShow}`);
          (async function () {
            await requestSceneList();
          })();
          return;
        }

        if (key.name === mapping.keyPressed && mapping.sceneToShow !== "list-all") {
          console.log(`Scene Change Button: ${mapping.keyPressed}`);
          (async function () {
            await requestSceneChange(mapping.sceneToShow);
          })();
          return;
        }
      }
    }
  });
} catch (err) {
  console.error(err);
}

// Functions

async function processIncomingMessage(topic, payload) {
  console.log('Received Message:', topic, payload.toString())
};

async function requestSceneChange(sceneName) {
  console.log(`Change to ${sceneName}`);
  await obsStudio.call('SetCurrentProgramScene', { sceneName: sceneName });
}

async function requestSceneList() {
  console.log(`Requesting list of scenes`);
  var sceneList = await obsStudio.call('GetSceneList');
  console.log('Scene List: ');
  console.log(sceneList);
}
