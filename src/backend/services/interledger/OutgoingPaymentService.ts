import { Database } from '../../db';
import { OutgoingPayment } from '../../../src/types';

export class OutgoingPaymentService {
  /**
   * Generates outbound payment assets
   */
  static async createOutgoingPayment(
    pointer: string,
    amount: number,
    currency: string,
    description: string
  ): Promise<OutgoingPayment> {
    const db = Database.read();
    
    const paymentId = 'out_' + Math.random().toString(36).substr(2, 9);
    const newPayment: OutgoingPayment = {
      id: paymentId,
      pointer,
      amount,
      currency,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    db.outgoingPayments.push(newPayment);
    Database.write(db);
    Database.log('OUTGOING_PAYMENT_CREATED', `Outgoing payment ${paymentId} negotiated for R ${amount}.`);
    
    return newPayment;
  }

  /**
   * Finalizes the outgoing payment execution
   */
  static async completeOutgoingPayment(paymentId: string): Promise<boolean> {
    const db = Database.read();
    const payment = db.outgoingPayments.find(p => p.id === paymentId);
    if (payment && payment.status === 'pending') {
      payment.status = 'completed';
      Database.write(db);
      Database.log('OUTGOING_PAYMENT_COMPLETED', `Outgoing payment ${paymentId} was successfully settled.`);
      return true;
    }
    return false;
  }
}
