const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Donation {
  static async create(donationData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO donations (id, user_id, amount, currency, paypal_transaction_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      donationData.userId,
      donationData.amount,
      donationData.currency || 'EUR',
      donationData.paypalTransactionId || null,
      donationData.status || 'pending'
    ];
    
    await query(sql, params);
    return this.findById(id);
  }

  static async findById(id) {
    const donation = await queryOne('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donation) return null;
    return this.formatDonation(donation);
  }

  static async findByUserId(userId) {
    const sql = 'SELECT * FROM donations WHERE user_id = ? ORDER BY created_at DESC';
    const donations = await query(sql, [userId]);
    return donations.map(d => this.formatDonation(d));
  }

  static async update(id, donationData) {
    const fields = [];
    const params = [];
    
    if (donationData.status !== undefined) {
      fields.push('status = ?');
      params.push(donationData.status);
    }
    if (donationData.paypalTransactionId !== undefined) {
      fields.push('paypal_transaction_id = ?');
      params.push(donationData.paypalTransactionId);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    const sql = `UPDATE donations SET ${fields.join(', ')} WHERE id = ?`;
    
    await query(sql, params);
    return this.findById(id);
  }

  static async getTotalByUser(userId) {
    const result = await queryOne(
      'SELECT SUM(amount) as total FROM donations WHERE user_id = ? AND status = "completed"',
      [userId]
    );
    return result?.total || 0;
  }

  static formatDonation(donation) {
    return {
      id: donation.id,
      userId: donation.user_id,
      amount: parseFloat(donation.amount),
      currency: donation.currency,
      paypalTransactionId: donation.paypal_transaction_id,
      status: donation.status,
      createdAt: new Date(donation.created_at).getTime(),
      updatedAt: new Date(donation.updated_at).getTime()
    };
  }
}

module.exports = Donation;
