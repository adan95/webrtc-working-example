const SIGNALING_SERVER_URL = "http://34.132.73.12:9999";
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
  socket.emit("data", data);
};

// WebRTC methods.
let peerConnection;
let localStream;
let remoteStreamElement = document.querySelector("#remoteStream");

let getLocalStream = () => {
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

// Start connection
getLocalStream();
