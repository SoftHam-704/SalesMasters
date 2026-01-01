require('dotenv').config();

console.log("All Environment keys:");
const keys = Object.keys(process.env);
console.log(keys);

// Check if password is a string (without printing it)
if (process.env.POSTGRES_PASSWORD) {
    console.log("POSTGRES_PASSWORD type:", typeof process.env.POSTGRES_PASSWORD);
    console.log("POSTGRES_PASSWORD length:", process.env.POSTGRES_PASSWORD.length);
} else {
    console.log("POSTGRES_PASSWORD is undefined or empty");
}

if (process.env.DB_PASSWORD) {
    console.log("DB_PASSWORD type:", typeof process.env.DB_PASSWORD);
}
