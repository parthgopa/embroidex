import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5000",
    baseURL: "https://embroidex_backend.merishiksha.com",

});

export default API;