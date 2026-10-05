import { useState } from 'react';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

function Header() {
    const [darkMode, setDarkMode] = useState(true);
    const handleThemeChange = (event) => {
        const checked = event.target.checked;
        setDarkMode(!checked);
        document.body.classList.toggle('light-theme', checked);
    };

    return (
        <header className="page-header">
            <div className="brand-section">
                <div className="brand-info">
                    <h1>
                        Deploy Athena
                    </h1>
                    <span className="brand-subtitle">
                        Deployment Control Center
                    </span>
                </div>
            </div>
            <div className="theme-switch">
                <input
                    type="checkbox"
                    id="theme-toggle"
                    checked={!darkMode}
                    onChange={handleThemeChange}
                />

                <label
                    htmlFor="theme-toggle"
                    className="theme-label"
                    title="Cambiar tema"
                >
                    <span className="theme-icon moon">
                        <MoonOutlined />
                    </span>

                    <span className="theme-track">
                        <span className="theme-thumb" />
                    </span>

                    <span className="theme-icon sun">
                        <SunOutlined />
                    </span>
                </label>
            </div>
        </header>
    );
}

export default Header;