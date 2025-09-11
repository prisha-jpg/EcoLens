"use client";

import React from 'react';

const Footer = ({ children }: { children?: React.ReactNode }) => {
  return (
    <footer className="bg-green-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-8 md:space-y-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">EcoLens</span>
            </div>
            <p className="text-green-200 mt-2">Making sustainable choices easier.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-6 sm:space-y-0">
            <div>
              <h5 className="font-semibold mb-3">Features</h5>
              <ul className="space-y-2 text-green-200">
                <li><a href="#" className="hover:text-white">Eco-Comparison</a></li>
                <li><a href="#" className="hover:text-white">Green Scorecard</a></li>
                <li><a href="#" className="hover:text-white">Product Finder</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-green-200">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-green-700 mt-8 pt-6 text-center text-green-200 text-sm">
          <p>© {new Date().getFullYear()} EcoLens. All rights reserved.</p>
        </div>
      </div>
      {children}
    </footer>
  );
};

export default Footer;
