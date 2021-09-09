// Import Modules

import {initializeApp} from 'firebase/app';
import {getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDocs, onSnapshot} from 'firebase/firestore';

// Set Up Variables
const app = initializeApp({projectId: "p2p-video-chat-application"});
const db = getFirestore(app);
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const localVideo = document.querySelector('.local-stream');
const remoteVideo = document.querySelector('.remote-stream');
let room;
let localStream;
let remoteStream;

// Initialize
const init = async => {
  let pc = new RTCPeerConnection(servers);
  
};

init();

