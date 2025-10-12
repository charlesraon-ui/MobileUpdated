import express from 'express';
import multer from 'multer';
import {
    createRefundTicket,
    getMyRefundTickets,
    getOrderWithRefundStatus,
    getRefundTicketById,
    uploadRefundImages
} from '../controllers/refundTicketController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });


// Get order with refund status
router.get('/order/:orderId', authMiddleware, getOrderWithRefundStatus);

// Upload refund images
router.post('/upload', authMiddleware, uploadMemory.array('images', 5), uploadRefundImages);

// Create refund ticket
router.post('/', authMiddleware, createRefundTicket);

// Get user's refund tickets
router.get('/my-tickets', authMiddleware, getMyRefundTickets);

// Get single refund ticket
router.get('/:ticketId', authMiddleware, getRefundTicketById);

export default router;