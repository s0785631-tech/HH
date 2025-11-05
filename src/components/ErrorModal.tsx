import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "¡Ups, parece que algo salió mal!",
  message = "Las credenciales proporcionadas no son válidas",
  buttonText = "Aceptar"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Pequeño delay para activar la animación después de que el modal sea visible
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación antes de ocultar completamente
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black bg-opacity-50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-75 opacity-0 translate-y-8'
        }`}
        style={{
          animation: isAnimating ? 'modalBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="px-8 py-8 text-center">
          {/* Warning Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-900" fill="currentColor" />
              </div>
              {/* Pulse animation ring */}
              <div className="absolute inset-0 w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* Custom CSS for bounce animation */}
      <style jsx>{`
        @keyframes modalBounce {
          0% {
            transform: scale(0.3) translateY(100px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-10px);
            opacity: 0.8;
          }
          70% {
            transform: scale(0.95) translateY(5px);
            opacity: 0.9;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;