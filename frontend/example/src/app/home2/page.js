"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useAxiosAuth from "../hooks/useAxiosAuth";

const baseUrl = "http://127.0.0.1:8000/api";

export default function Home() {
    const [counter, setCounter] = useState();
    const router = useRouter();

    useEffect(() => {
        getCounter();
    }, []);

    const axiosAuth = useAxiosAuth();

    const getCounter = async () => {
        try {
            const response = await axiosAuth.get(`${baseUrl}/counter`);
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