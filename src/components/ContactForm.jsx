import React, { useState, useRef, useEffect } from 'react';
import { init, sendForm } from '@emailjs/browser';
import './ContactForm.css';

export default function ContactForm({ isOpen, onClose }) {
  const formRef = useRef();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    // Initialize EmailJS with your public key
    init("YOUR_PUBLIC_KEY");
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending message...' });

    try {
      await sendForm(
        'service_acryfusion',
        'template_contact_form',
        formRef.current
      );

      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setFormData({ email: '', phone: '', message: '' });
      
      // Close the form after 2 seconds
      setTimeout(() => {
        onClose();
        setStatus({ type: '', message: '' });
      }, 2000);
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact modal-overlay">
      <div className="contact modal-content">
        <button className="contact close-button" onClick={onClose}>&times;</button>
        
        <div className="contact-form-container">
          <div className='modal-header'>
            <h2>Contact Us</h2>
          </div>
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            {status.message && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <button type="submit" className="submit button black">
              Send Message
            </button>
          </form>
        </div>

        <div className="contact-info">
          <div className="info-item">
            <p><span>Location</span>: Madurai, Tamil Nadu</p>
          </div>
          <div className="info-item">
            <p><span>Email</span>: acryfusionworks@gmail.com</p>
          </div>
          <div className="info-item">
            <p><span>Phone</span>: 9488901495</p>
          </div>
        </div>
      </div>
    </div>
  );
} 