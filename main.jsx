// Single entry point — Letters Generator (Himachal Pradesh Police).
// The earlier dossier and dashboard apps were dropped; this is the only
// surface the IO needs.
import React from 'react';
import ReactDOM from 'react-dom/client';

import './letters-data.js';
import './letters-templates.jsx';
import './letters-app.jsx';

const { LettersApp } = window;

ReactDOM.createRoot(document.getElementById('root')).render(<LettersApp />);
