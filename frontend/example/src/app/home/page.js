"use client"

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const baseUrl = "http://127.0.0.1:8000/api";

const axiosAuthInstance = axios.create();
let fetchingToken = false;
let requestQueue = [];

axiosAuthInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
}, (error) => {
    Promise.reject(error);
});

axiosAuthInstance.interceptors.response.use((response) => {
    return response;
}, async (onError) => {
    if (onError.response.status === 401) {
        try {
            const { response } = onError;
            const retryOriginalRequest = new Promise((resolve, reject) => {
                requestQueue.push((token) => {
                    response.config.headers.Authorization = `Bearer ${token}`;
                    resolve(axios(response.config));
                });
            });

            if (!fetchingToken) {
                fetchingToken = true;

                // coba request accessToken baru dengan refreshToken
                const refreshToken = localStorage.getItem("refreshToken");
                const { data } = await axios.post(`${baseUrl}/auth/refresh`, {
                    refreshToken: refreshToken,
                });

                const newAccessToken = data.accessToken;
                localStorage.setItem("accessToken", newAccessToken);

                // ketika sudah dapet token baru exsekusi antrian request yang gagal 
                requestQueue.forEach((callback) => {
                    callback(newAccessToken);
                });
                requestQueue = [];
            }

            return retryOriginalRequest;
        } catch (error) {
            if (error.name === "AxiosError") {
                // ketika refreshTokennya Expired
                if (error.response.status === 401) {
                    return Promise.reject(onError);
                }
            }
        } finally {
            fetchingToken = false;
        }
    }

    return Promise.reject(onError);
});

export default function Home() {
    const [counter, setCounter] = useState();
    const router = useRouter();

    useEffect(() => {
        getCounter();
    }, []);

    const accessToken = localStorage.getItem("accessToken");

    const getCounter = async () => {
        try {
            const response = await axiosAuthInstance.get(`${baseUrl}/counter`);
            console.log(response);

            if (response.status === 200) {
                setCounter(response.data.counter);
            }

        } catch (error) {
            if (error.name === "AxiosError") {
                if (error.response.status === 401) {
                    alert(error.response.data.message);
                    router.replace("/login");
                }
            } else {
                console.log(error);
            }
        }
    }

    return (
        <>
            <h1>Halo</h1>
            <h2>Current Counter: {counter}</h2>
            <button onClick={getCounter}>Counter</button>
        </>
    );
}