module.exports = {
    apps: [
        {
            name: "salesmasters-backend",
            script: "server.js",
            cwd: "./backend",
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
            script: "main.py",
            cwd: "./bi-engine",
            interpreter: "python3",
            env: {
                PORT: 8000
            }
        },
        {
            name: "softham-backend",
            script: "server.cjs",
            cwd: "./backend-adm",
            instances: 1,
            env: {
                PORT: 8081
            }
        },
        {
            name: "mastercount-api",
            script: "dist/server.js",
            cwd: "./backend-cnt",
            instances: 1,
            env: {
                PORT: 8082
            }
        }
    ]
};
