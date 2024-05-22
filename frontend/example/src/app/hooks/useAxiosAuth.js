import { useEffect } from "react";
import axios from "axios";

const axiosAuthInstance = axios.create();
let fetchingToken = false;
let requestQueue = [];

const baseUrl = "http://127.0.0.1:8000/api";

const useAxiosAuth = () => {
    useEffect(() => {
        const requestInterceptor = axiosAuthInstance.interceptors.request.use((config) => {
            const accessToken = localStorage.getItem("accessToken");
            config.headers.Authorization = `Bearer ${accessToken}`;
            return config;
        }, (error) => {
            Promise.reject(error);
        });

        const responseInterceptor = axiosAuthInstance.interceptors.response.use((response) => {
            return response;
        }, async (onError) => {
            // jika response statusnya 401 (asumsinya adalah token expired)
            if (onError.response.status === 401) {
                try {
                    const { response } = onError;

                    // push original requst di queue
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
                        // !!reject
                        // user harus login lagi
                        // karena refreshToken sudah exired
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

        return () => {
            axiosAuthInstance.interceptors.request.eject(requestInterceptor);
            axiosAuthInstance.interceptors.response.eject(responseInterceptor);
        }
    }, []);

    return axiosAuthInstance;
}

export default useAxiosAuth;