import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3005/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default instance;
