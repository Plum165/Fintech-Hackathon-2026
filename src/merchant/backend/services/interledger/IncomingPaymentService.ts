import { Database } from '../../db';
import { IncomingPayment } from '../../../src/types';

export class IncomingPaymentService {
  /**
   * Creates an Incoming Payment pointer resource
   */
  static async createIncomingPayment(
    pointer: string, 
    amount: number, 
    currency: string, 
    description: string
  ): Promise<IncomingPayment & { qrCode: string }> {
    const db = Database.read();
    
    const paymentId = 'inc_' + Math.random().toString(36).substr(2, 9);
    const newPayment: IncomingPayment = {
      id: paymentId,
      pointer,
      amount,
      currency,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    db.incomingPayments.push(newPayment);
    Database.write(db);
    Database.log('INCOMING_PAYMENT_CREATED', `Incoming payment ${paymentId} generated for R ${amount}.`);
    
    // Simulate generation of a secure Interledger Open Payments QR code
    // Standard format: interledger-payment-link containing pointer and details
    const qrData = `interledger:${pointer}?amount=${amount}&currency=${currency}&id=${paymentId}`;
    
    return {
      ...newPayment,
      qrCode: qrData
    };
  }

  /**
   * Polls or gets state of an incoming payment
   */
  static async getIncomingPayment(paymentId: string): Promise<IncomingPayment | null> {
    const db = Database.read();
    const payment = db.incomingPayments.find(p => p.id === paymentId);
    return payment || null;
  }

  /**
   * Finalizes incoming payment as completed
   */
  static async completeIncomingPayment(paymentId: string): Promise<boolean> {
    const db = Database.read();
    const payment = db.incomingPayments.find(p => p.id === paymentId);
    if (payment && payment.status === 'pending') {
      payment.status = 'completed';
      Database.write(db);
      Database.log('INCOMING_PAYMENT_COMPLETED', `Incoming payment ${paymentId} was successfully settled.`);
      return true;
    }
    return false;
  }
}
