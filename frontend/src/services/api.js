import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5000",
  baseURL: "https://embroidex-backend.merishiksha.com",
  withCredentials: true,
});

export default API;