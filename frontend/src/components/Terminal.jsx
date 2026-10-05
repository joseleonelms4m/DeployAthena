import { Button } from 'antd';
import {
    DeleteOutlined,
    CodeOutlined
} from '@ant-design/icons';

function Terminal({ logs = [], onClear }) {

    return (
        <section className="terminal-section">

            <div className="terminal-wrap">

                <div className="terminal-header">

                    <div className="terminal-title">

                        <span className="terminal-status" />

                        <CodeOutlined />

                        <span>
                            deploy log
                        </span>

                    </div>

                    <Button
                        type="text"
                        className="clear-terminal"
                        icon={<DeleteOutlined />}
                        onClick={onClear}
                    >
                        Limpiar
                    </Button>

                </div>

                <div id="terminal">

                    {logs.length === 0 ? (
                        <span className="dim">
                            esperando actividad...
                        </span>
                    ) : (
                        logs.map((log, index) => (
                            <div
                                key={index}
                                className={log.type || ''}
                            >
                                {log.message}
                            </div>
                        ))
                    )}

                </div>

            </div>

        </section>
    );
}

export default Terminal;