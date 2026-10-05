import { createRoot } from 'react-dom/client';

import 'antd/dist/reset.css';
import './styles/global.css';

import App from './App';
import AntThemeProvider from './AntThemeProvider';

createRoot(document.getElementById('root')).render(
    <AntThemeProvider>
        <App />
    </AntThemeProvider>
);