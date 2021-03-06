// Import Modules

import {initializeApp} from 'firebase/app';
import {getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot} from 'firebase/firestore';

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
const init = async () => {
  let pc = new RTCPeerConnection(servers);
  let ch = pc.createDataChannel('');

  try {
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio: false});
    remoteStream = new MediaStream();

    while (!room) {
      room = prompt('Enter a room name:');

      if (room === null) {
        localStream.getTracks().forEach((track) => track.stop());
        return alert('The room name is required');
      }
    }

    // Push Tracks from Local Stream to Peer Connection
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // Pull Tracks from Remote Stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
    };

    localVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

  } catch (error) {
    console.log(error);
    alert('Camera and Microphone are required');
  }

  try {
    const roomRef = doc(db, 'rooms', room);
    const roomDoc = await getDoc(roomRef);
    const offerCandidates = collection(db, 'rooms', room, 'offerCandidates');
    const answerCandidates = collection(db, 'rooms', room, 'answerCandidates');

    ch.onclose = async () => {
      await deleteDoc(roomRef);
      await getDocs(offerCandidates).then((docs) => docs.forEach(async (entry) => await deleteDoc(doc(db, 'rooms', room, 'offerCandidates', entry.id))));
      await getDocs(answerCandidates).then((docs) => docs.forEach(async (entry) => await deleteDoc(doc(db, 'rooms', room, 'answerCandidates', entry.id)))); 
      roomRef.onSnapshot = null;
      offerCandiates.onSnapshot = null;
      answerCandidates.onSnapshot = null;
      pc.close();
      pc = null;
      init();
    };

    window.addEventListener('beforeunload', () => {
      pc.close();
      pc = null;
    });

    if (roomDoc.exists() && roomDoc.data()?.answer) {
      alert('Room is full');
    } else if (roomDoc.exists()) {
      pc.onicecandidate = (event) => {
        event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce();
        }
      };

      const offerDescription = roomDoc.data().offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp
      };

      await updateDoc(roomRef, {answer});

      onSnapshot(offerCandidates, (doc) => {
        doc.docChanges().forEach((change) => {
          if (change.type === 'added') {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    } else {
      pc.onicecandidate = (event) => {
        event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce();
        }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      onSnapshot(roomRef, (doc) => {
        const data = doc.data();
        if (data?.answer) {
          pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      const offer = {
        type: offerDescription.type,
        sdp: offerDescription.sdp
      };

      setDoc(roomRef, {offer});

      onSnapshot(answerCandidates, (doc) => {
        doc.docChanges().forEach((change) => {
          if (change.type === 'added') {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    }
  }

  catch (error) {
    console.log(error);
  }

};

init();

