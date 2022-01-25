const SIGNALING_SERVER_URL = "34.132.73.12:9999";
// const SIGNALING_SERVER_URL = "http://localhost:9999";
const TURN_SERVER_URL = "34.132.73.12:3478";
const TURN_SERVER_USERNAME = "username";
const TURN_SERVER_CREDENTIAL = "credential";

const PC_CONFIG = {
  iceServers: [
    {
      urls: "turn:" + TURN_SERVER_URL + "?transport=tcp",
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL,
    },
    {
      urls: "turn:" + TURN_SERVER_URL + "?transport=udp",
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL,
    },
  ],
};

// Signaling methods.
let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on("data", (data) => {
  console.log("Data received: ", data);
  handleSignalingData(data);
});

socket.on("ready", () => {
  console.log("Ready");
  // Connection with signaling server is ready, and so is local stream.
  createPeerConnection();
  sendOffer();
});

let sendData = (data) => {
  console.log("Send data: ", data);
  socket.emit("data", data);
};

// WebRTC methods.
let peerConnection;
let localStream;
let remoteStreamElement = document.querySelector("#remoteStream");

// GPT-3 methods.
let start, stop; // Start and stop time of the API call.

const toBase64 = (str) => {
  return btoa(str);
};

const mapDataToAPI = (data) => {
  if (typeof data === "string") {
    return toBase64(data);
  }
  if (typeof data === "object") {
    const stringifiedData = JSON.stringify(data);
    return toBase64(stringifiedData);
  }
  return data;
};

const objectToJSON = (query) => {
  mock_message =
    "I am doing very well thanks for asking. Today we will be talking about machine learning and other related subjects in artificial intelligence.";

  console.log("Message sent:\n", query);

  return {
    name: "video_".concat(Date.now().toString()),
    text: query,
  };
};

// Stablish connection with GPT-3.
let getGPT3Stream = (query) => {
  const object = objectToJSON(query);
  const objectToAPI = mapDataToAPI(object);

  const request = {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: objectToAPI,
  };
  console.log("Request to Server:\n", request);

  // Send the request to the server.
  fetch("http://34.123.227.30:3134/api/e", request)
    .then((response) => response.json())
    .then((url) => {
      alert(response.json());
      console.log("Video Generated at:\n", url);

      // We play the video on Screen.
      remoteStreamElement.src = url;
      stop = Date.now();
      console.log("API Resolved at ", stop);
      console.log(`Time Taken to execute = ${(stop - start) / 1000} seconds`);
    });
};

// Main function of the script.
let getLocalStream = () => {
  window.onload = () => {
    socket.connect();

    // Button on screen.
    var textarea = document.getElementById("text");
    var callAPI = document.createElement("Button");

    textarea.style.position = "absolute";
    textarea.style.bottom = "30px";

    callAPI.innerHTML = "Send API Call";
    callAPI.style.position = "absolute";
    callAPI.style.marginLeft = "70px";
    callAPI.style.bottom = "10px";

    callAPI.onclick = () => {
      start = Date.now();
      message = textarea.value;

      console.log("API Called at ", start);
      getGPT3Stream(message);
    };

    document.body.appendChild(callAPI);
  };
};

// Original Main function of the script.
/*
let getLocalStream = () => {
  // Make use of the browser's media capabilities to get a local stream.
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((stream) => {
      console.log("Stream found");
      localStream = stream;
      // Connect after making sure that local stream is available.
      socket.connect();
    })
    .catch((error) => {
      console.error("Stream not found: ", error);
    });
};
*/

let createPeerConnection = () => {
  try {
    peerConnection = new RTCPeerConnection(PC_CONFIG);
    peerConnection.onicecandidate = onIceCandidate;
    peerConnection.onaddstream = onAddStream;
    peerConnection.addStream(localStream);
    console.log("PeerConnection created");
  } catch (error) {
    console.error("PeerConnection failed: ", error);
  }
};

let sendOffer = () => {
  console.log("Send offer");
  peerConnection.createOffer().then(setAndSendLocalDescription, (error) => {
    console.error("Send offer failed: ", error);
  });
};

let sendAnswer = () => {
  console.log("Send answer");
  peerConnection.createAnswer().then(setAndSendLocalDescription, (error) => {
    console.error("Send answer failed: ", error);
  });
};

let setAndSendLocalDescription = (sessionDescription) => {
  peerConnection.setLocalDescription(sessionDescription);
  console.log("Local description set");
  sendData(sessionDescription);
};

let onIceCandidate = (event) => {
  if (event.candidate) {
    console.log("ICE candidate");
    sendData({
      type: "candidate",
      candidate: event.candidate,
    });
  }
};

let onAddStream = (event) => {
  console.log("Add stream");
  remoteStreamElement.srcObject = event.stream;
};

let handleSignalingData = (data) => {
  switch (data.type) {
    case "offer":
      createPeerConnection();
      peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer();
      break;
    case "answer":
      peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      break;
    case "candidate":
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
};

// Start connection.
getLocalStream();
