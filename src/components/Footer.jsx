import React, { useState } from 'react';
import instagramIcon from '../assets/icons/instagram-icon.svg';
import youtubeIcon from '../assets/icons/youtube-icon.svg';
import whatsappIcon from '../assets/icons/whatsapp-icon.svg';
import ContactForm from './ContactForm';
import './Footer.css';

export default function Footer() {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  return (
    <footer className="site-footer">
      <div className="contact-container nav black">
        <a onClick={() => setIsContactFormOpen(true)}>
          Contact Us
        </a>
      </div>
      <div className="social-links">        
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <img src={whatsappIcon} alt="Whatsapp" />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <img src={instagramIcon} alt="Instagram" />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <img src={youtubeIcon} alt="YouTube" />
        </a>
      </div>
      {isContactFormOpen && (
        <ContactForm 
          isOpen={isContactFormOpen} 
          onClose={() => setIsContactFormOpen(false)} 
        />
      )}
    </footer>
  );
} 