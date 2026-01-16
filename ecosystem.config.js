module.exports = {
    apps: [
        {
            name: "salesmasters-backend",
            script: "./backend/server.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: 8080
            }
        },
        {
            name: "salesmasters-bi",
            script: "./bi-engine/venv/bin/uvicorn",
            args: "main:app --host 0.0.0.0 --port 8000",
            interpreter: "none", // Executa o binário diretamente do venv
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "2G"
        }
    ]
};
