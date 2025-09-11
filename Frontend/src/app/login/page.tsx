"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import axios, { AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

const backendUrl = "http://localhost:5001"; // <-- Change to your backend URL

const Login: React.FC = () => {
  const [currentState, setCurrentState] = useState<"login" | "signup">("login");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const router = useRouter();

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      let response: AxiosResponse<AuthResponse>;

      if (currentState === "signup") {
        response = await axios.post<AuthResponse>(
          `${backendUrl}/api/users/register`,
          {
            name,
            email,
            password,
          }
        );
      } else {
        response = await axios.post<AuthResponse>(
          `${backendUrl}/api/users/login`,
          {
            email,
            password,
          }
        );
      }

      if (response.data.success && response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Store only in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userId", user._id);

        toast.success(
          currentState === "signup"
            ? "Sign Up Successful!"
            : "Login Successful!"
        );

        // Small delay so toast is visible before redirect
        setTimeout(() => {
          router.push("/");
        }, 800);
      } else {
        toast.error(
          response.data.message ||
            (currentState === "signup"
              ? "Signup failed"
              : "Invalid credentials")
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || error.message || "Something went wrong"
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/"); // already logged in → go home
    }
  }, [router]);

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl capitalize">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "signup" && (
        <input
          onChange={handleChange(setName)}
          value={name}
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Name"
          required
        />
      )}

      <input
        onChange={handleChange(setEmail)}
        value={email}
        type="email"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Email"
        required
      />

      <input
        onChange={handleChange(setPassword)}
        value={password}
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        required
      />

      <div className="w-full flex justify-between text-sm mt-[8px]">
        <p className="cursor-pointer">Forgot your password?</p>
        <p
          onClick={() =>
            setCurrentState((prev) => (prev === "login" ? "signup" : "login"))
          }
          className="cursor-pointer"
        >
          {currentState === "login" ? "Create Account" : "Login Here"}
        </p>
      </div>
   
      <button className="bg-black text-white font-light px-8 py-2 mt-4 cursor-pointer hover:bg-grey-100 transition-colors duration-200">
        {currentState === "login" ? "Sign In" : "Sign Up"}
      </button>
     

      
    </form>
  );
};

export default Login;



// "use client";

// import React, { useState, FormEvent, ChangeEvent } from "react";
// import axios, { AxiosResponse } from "axios";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// interface User {
//   _id: string;
//   name: string;
//   email: string;
// }

// interface AuthResponse {
//   success: boolean;
//   token?: string;
//   user?: User;
//   message?: string;
// }

// const backendUrl = "http://localhost:5001"; // <-- Change to your backend URL

// const Login: React.FC = () => {
//   const [currentState, setCurrentState] = useState<"login" | "signup">("login");
//   const [name, setName] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [email, setEmail] = useState<string>("");

//   const router = useRouter();

//   const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     try {
//       let response: AxiosResponse<AuthResponse>;

//       if (currentState === "signup") {
//         response = await axios.post<AuthResponse>(
//           `${backendUrl}/api/users/register`,
//           {
//             name,
//             email,
//             password,
//           }
//         );
//       } else {
//         response = await axios.post<AuthResponse>(
//           `${backendUrl}/api/users/login`,
//           {
//             email,
//             password,
//           }
//         );
//       }

//       if (response.data.success && response.data.token && response.data.user) {
//         const { token, user } = response.data;

//         // store only in localStorage
//         localStorage.setItem("token", token);
//         localStorage.setItem("userId", user._id);
//         toast.success(
//           currentState === "signup"
//             ? "Sign Up Successful!"
//             : "Login Successful!"
//         );
//         router.push("/");
//       } else {
//         toast.error(
//           response.data.message ||
//             (currentState === "signup"
//               ? "Signup failed"
//               : "Invalid credentials")
//         );
//       }
//     } catch (error: any) {
//       console.error(error);
//       toast.error(
//         error.response?.data?.message || error.message || "Something went wrong"
//       );
//     }
//   };
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       router.push("/"); // already logged in → go home
//     }
//   }, [router]);

//   const handleChange =
//     (setter: React.Dispatch<React.SetStateAction<string>>) =>
//     (e: ChangeEvent<HTMLInputElement>) =>
//       setter(e.target.value);

//   return (
//     <form
//       onSubmit={onSubmitHandler}
//       className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
//     >
//       <div className="inline-flex items-center gap-2 mb-2 mt-10">
//         <p className="prata-regular text-3xl capitalize">{currentState}</p>
//         <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
//       </div>

//       {currentState === "signup" && (
//         <input
//           onChange={handleChange(setName)}
//           value={name}
//           type="text"
//           className="w-full px-3 py-2 border border-gray-800"
//           placeholder="Name"
//           required
//         />
//       )}

//       <input
//         onChange={handleChange(setEmail)}
//         value={email}
//         type="email"
//         className="w-full px-3 py-2 border border-gray-800"
//         placeholder="Email"
//         required
//       />

//       <input
//         onChange={handleChange(setPassword)}
//         value={password}
//         type="password"
//         className="w-full px-3 py-2 border border-gray-800"
//         placeholder="Password"
//         required
//       />

//       <div className="w-full flex justify-between text-sm mt-[8px]">
//         <p className="cursor-pointer">Forgot your password?</p>
//         <p
//           onClick={() =>
//             setCurrentState((prev) => (prev === "login" ? "signup" : "login"))
//           }
//           className="cursor-pointer"
//         >
//           {currentState === "login" ? "Create Account" : "Login Here"}
//         </p>
//       </div>

//       <button className="bg-black text-white font-light px-8 py-2 mt-4">
//         {currentState === "login" ? "Sign In" : "Sign Up"}
//       </button>
//     </form>
//   );
// };

// export default Login;
