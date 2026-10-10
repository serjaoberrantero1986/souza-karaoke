import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { YoutubeAudioSource, YoutubeAudioOutput } from './components/YoutubeAudioWindows';

const params = new URLSearchParams(window.location.search);
const content = params.has('youtube-source') ? <YoutubeAudioSource/> : params.has('audio-output') ? <YoutubeAudioOutput/> : <App/>;

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{content}</React.StrictMode>);
