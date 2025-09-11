"use client";

import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userAvatar");
    }
    setToken(null);
    setAvatar(null);
    setIsDropdownOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedToken) setToken(savedToken);
      if (savedAvatar) setAvatar(savedAvatar);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12">
            <img src="/assets/ecologo.png" alt="EcoLens Logo" className="w-full h-full object-contain" />
          </div>
          <h1>
            <Link href="/" className="text-2xl font-bold">EcoLens</Link>
          </h1>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-6 items-center">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            {/* <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li> */}
            <li><Link href="/compare" className="hover:underline">Compare</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>

            {/* Profile with click dropdown */}
            <li className="relative cursor-pointer profile-dropdown-container">
              <div
                className="w-9 h-9 rounded-full border-2 border-green-400 shadow-md overflow-hidden transition-transform hover:scale-105 bg-white"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setAvatar(null)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-green-100 text-green-600">
                    <User size={20} />
                  </div>
                )}
              </div>

              {/* Always show dropdown when open, regardless of login status */}
              {isDropdownOpen && (
                <div className="absolute right-0 pt-4">
                  <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-700 rounded-md shadow-lg z-100">
                    <p
                      onClick={() => {
                        router.push("/profile");
                        setIsDropdownOpen(false);
                      }}
                      className="cursor-pointer hover:text-black"
                    >
                      My Profile
                    </p>
                    <p
                      onClick={() => {
                        router.push("/login");
                        setIsDropdownOpen(false);
                      }}
                      className="cursor-pointer hover:text-black"
                    >
                      Login
                    </p>
                    <p
                      onClick={logout}
                      className="cursor-pointer hover:text-black"
                    >
                      Logout
                    </p>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;



// "use client";

// import React, { useEffect, useState } from 'react';
// import { User } from 'lucide-react';
// import Link from 'next/link';

// const Navbar = ({ children }: { children?: React.ReactNode }) => {
//   const [avatar, setAvatar] = useState<string | null>(null);
//   const [token, setToken] = useState<string | null>(null);

//   // Load the saved avatar when component mounts
//   useEffect(() => {
//   const savedToken = localStorage.getItem("token") || Cookies.get("token") || null;
//   setToken(savedToken);
// }, []);
// useEffect(() => {
//   if (typeof window !== "undefined") {
//     const savedAvatar = localStorage.getItem("userAvatar");
//     // Import js-cookie inside the effect to ensure client-side
//     import("js-cookie").then(CookiesModule => {
//       const Cookies = CookiesModule.default;
//       const savedToken =
//         localStorage.getItem("token") || Cookies.get("token") || null;
//       if (savedAvatar) setAvatar(savedAvatar);
//       setToken(savedToken);
//     });
//   }
// }, []);

//   useEffect(() => {
//     const savedAvatar = localStorage.getItem('userAvatar');
//     if (savedAvatar) {
//       setAvatar(savedAvatar);
//     } else {
//       // fallback to a simple identicon or leave as null to show User icon
//       setAvatar(null);
//     }
//   }, []);

//   return (
//     <header className="bg-green-600 text-white shadow-lg">
//       <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//         <div className="flex items-center space-x-2">
//           {/* Logo */}
//           <div className="w-12 h-12">
//             <img
//               src="/assets/ecologo.png"
//               alt="EcoLens Logo"
//               className="w-full h-full object-contain"
//             />
//           </div>
//           <h1>
//             <Link href="/" className="text-2xl font-bold">
//               EcoLens
//             </Link>
//           </h1>
//         </div>

//         <nav>
//           <ul className="flex space-x-6 items-center">
//             <li>
//               <Link href="/" className="hover:underline">
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link href="/dashboard" className="hover:underline">
//                 Dashboard
//               </Link>
//             </li>            <li>
//               <Link href="/compare" className="hover:underline">
//                 Compare
//               </Link>
//             </li>
//             <li>
//               <Link href="/about" className="hover:underline">
//                 About
//               </Link>
//             </li>
//             <li className="group relative cursor-pointer">
//   {/* Avatar */}
//   <div
//     onClick={() => {
//       if (!token) router.push("/login");
//     }}
//     className="w-9 h-9 rounded-full border-2 border-green-400 shadow-md overflow-hidden transition-transform hover:scale-105 bg-white"
//   >
//     {avatar ? (
//       <img
//         src={avatar}
//         alt="Profile"
//         className="w-full h-full object-cover transition-opacity duration-300"
//         onError={() => setAvatar(null)}
//       />
//     ) : (
//       <div className="flex items-center justify-center w-full h-full bg-green-100 text-green-600">
//         <User size={20} />
//       </div>
//     )}
//   </div>

//   {/* Dropdown menu — only if logged in */}
//   {token && (
//     <div className="hidden group-hover:block absolute right-0 pt-4">
//       <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-700 rounded-md shadow-lg">
//         <p
//           onClick={() => router.push("/profile")}
//           className="cursor-pointer hover:text-black"
//         >
//           My Profile
//         </p>
//         <p
//           onClick={() => router.push("/login")}
//           className="cursor-pointer hover:text-black"
//         >
//           Login
//         </p>
//         <p
//           onClick={logout}
//           className="cursor-pointer hover:text-black"
//         >
//           Logout
//         </p>
//       </div>
//     </div>
//   )}
// </li>

//             {/* <li>
//               <Link href="/profile" className="flex items-center space-x-2 hover:underline">
//                 <div className="w-9 h-9 rounded-full border-2 border-green-400 shadow-md overflow-hidden transition-transform hover:scale-105 bg-white">
//                   {avatar ? (
//                     <img
//                       src={avatar}
//                       alt="Profile"
//                       className="w-full h-full object-cover transition-opacity duration-300"
//                       onError={(e) => {
//                         // fallback to null if avatar is broken — triggers User icon
//                         setAvatar(null);
//                       }}
//                     />
//                   ) : (
//                     <div className="flex items-center justify-center w-full h-full bg-green-100 text-green-600">
//                       <User size={20} />
//                     </div>
//                   )}
//                 </div>
//               </Link>
//             </li> */}
//           </ul>
//         </nav>
//       </div>
//       {children}
//     </header>
//   );
// };

// export default Navbar;
