import { useEffect, useState } from 'react';
import { App as AntApp, ConfigProvider, theme } from 'antd';

const { darkAlgorithm, defaultAlgorithm } = theme;

function AntThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
    const toggle = document.getElementById('theme-toggle');

    return toggle ? !toggle.checked : true;
});

    useEffect(() => {
        const toggle = document.getElementById('theme-toggle');

        if (!toggle) return;

        const handleChange = () => {
    setIsDark(!toggle.checked);
};

        toggle.addEventListener('change', handleChange);

        return () => {
            toggle.removeEventListener('change', handleChange);
        };
    }, []);

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark
                    ? darkAlgorithm
                    : defaultAlgorithm,

                token: {
                    colorPrimary: isDark
                        ? '#168dcc'
                        : '#0284c7',

                    colorSuccess: '#15803d',
                    colorError: '#c2410c',
                    colorInfo: '#0369a1',

                    colorBgBase: isDark
                        ? '#071426'
                        : '#f3f6f9',

                    colorBgContainer: isDark
                        ? '#0d2138'
                        : '#ffffff',

                    colorBgElevated: isDark
                        ? '#102943'
                        : '#ffffff',

                    colorText: isDark
                        ? '#e8f1f8'
                        : '#172033',

                    colorTextSecondary: isDark
                        ? '#9aacbd'
                        : '#4b5b6b',

                    colorTextTertiary: isDark
                        ? '#64788d'
                        : '#718096',

                    colorBorder: isDark
                        ? '#1d3d5b'
                        : '#d3dce5',

                    colorBorderSecondary: isDark
                        ? '#294d6d'
                        : '#c1ccd7',

                    borderRadius: 10,
                    borderRadiusSM: 7,
                },
            }}
        >
            <AntApp>
                {children}
            </AntApp>
        </ConfigProvider>
    );
}

export default AntThemeProvider;