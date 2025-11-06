const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    console.log('Token validated for user:', decoded.userId);
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = { authMiddleware };