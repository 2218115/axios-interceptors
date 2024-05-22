
"use client"

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const baseUrl = "http://127.0.0.1:8000/api";

export default function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const login = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${baseUrl}/auth/login`, {
                username: username,
                password: password,
            });

            console.log(response);

            if (response.status === 200) {
                const { accessToken, refreshToken } = response.data;

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);

                router.replace("/home");
            }

        } catch (error) {
            if (error.name === "AxiosError") {
                if (error.response.status === 401) {
                    alert(error.response.data.message);
                }
            }

            console.log(error);
        }
    }

    return (
        <main>
            <form onSubmit={login}>
                <div>
                    <label htmlFor="username">Username</label> <br></br>
                    <input type="text" name="username" onChange={(e) => { setUsername(e.target.value) }} />
                </div>
                <div>
                    <label htmlFor="password">Password</label> <br></br>
                    <input type="text" name="password" onChange={(e) => { setPassword(e.target.value) }} />
                </div>
                <button>Login</button>
            </form>
        </main>
    );
}
