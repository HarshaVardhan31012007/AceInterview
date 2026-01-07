import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 120000, // 120 seconds for regular requests
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Create a separate instance for AI requests (longer timeout)
export const axiosAIInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 300000, // 5 minutes for AI requests
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Request Interceptor for axiosInstance
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Request Interceptor for axiosAIInstance
axiosAIInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        console.log("📤 Sending AI request with token:", accessToken ? "✓ SET" : "❌ NOT SET");
        if (accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor for axiosInstance
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if(error.response){
            if(error.response.status === 401){
                console.error("Unauthorized - redirecting to login");
                window.location.href = "/";
            }
            else if(error.response.status === 500){
                console.error("Server error. Please try again later.");
            }
        }
        else if(error.code === "ECONNABORTED"){
            console.error("Request timeout. Please try again.");
        }
        return Promise.reject(error);
    }
);

// Response Interceptor for axiosAIInstance
axiosAIInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if(error.response){
            if(error.response.status === 401){
                console.error("Unauthorized AI request - redirecting to login");
                window.location.href = "/";
            }
        }
        else if(error.code === "ECONNABORTED"){
            console.error("AI Request timeout - server is taking too long. Please try again.");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
