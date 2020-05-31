import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/firestore';

firebase.initializeApp({
  apiKey: 'AIzaSyCIG3E0mb_5hTGqf8ktEYSu_3AeUmXmbTM',
  authDomain: 'toga-4e3f5.firebaseapp.com',
  databaseURL: 'https://toga-4e3f5.firebaseio.com',
  projectId: 'toga-4e3f5',
  storageBucket: 'toga-4e3f5.appspot.com',
  messagingSenderId: '39664165734',
  appId: '1:39664165734:web:55126f1975b61372ef9ea7',
  measurementId: 'G-WQ9G94QR0M',
});

export const firestore = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();
