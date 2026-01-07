"use client";

import React from "react";
import { FaGithub, FaLinkedin, FaFacebook, FaInstagram } from "react-icons/fa";
// import Link from "next/link";
// import Image from "next/image";
// import Logo from "@/public/assets/logo-bg.png";
// import Arnob from "@/public/assets/arnob.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 shadow-xl text-white px-2 sm:px-4 xl:px-8 py-4 mt-auto">
      <div className="max-w-9xl mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={Logo}
              alt="Logo"
              className="h-24 w-auto hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div> */}

        <div className="flex flex-col items-center text-center mt-2">
          <div>
            <p className="text-lg font-gloria">
              Sharing knowledge, one bug at a time.
              <br />
              Connect. Share. Debug.
            </p>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 mt-4">
            <a
              href="https://github.com/arnobt78"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 hover:scale-110 transition-transform duration-300"
            >
              <FaGithub />
            </a>
            <a
              href="https://www.linkedin.com/in/arnob-mahmud-05839655/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 hover:scale-110 transition-transform duration-300"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://www.facebook.com/arnob.mahmud"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 hover:scale-110 transition-transform duration-300"
            >
              <FaFacebook />
            </a>
            <a
              href="https://www.instagram.com/arnob_t78/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 hover:scale-110 transition-transform duration-300"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* <div className="w-24 h-24 bg-grey-300 hover:scale-105 transition-transform duration-300 rounded-full border-2 border-gray-200">
          <Image src={Arnob} alt="Logo" />
        </div> */}

        <div className="flex flex-col font-gloria items-center md:items-end">
          <p className="text-sm">Author: Arnob Mahmud</p>
          <p className="text-sm">Full Stack Web Developer</p>
          <p className="text-sm">arnob_t78@yahoo.com</p>
          <p className="text-sm">Germany | Bangladesh</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
