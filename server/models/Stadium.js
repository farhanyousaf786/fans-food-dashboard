const { db } = require('../server');

class Stadium {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  static async create(data) {
    const docRef = await db.collection('stadiums').add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    });
    return new Stadium(docRef.id, data);
  }

  static async findById(id) {
    const doc = await db.collection('stadiums').doc(id).get();
    if (!doc.exists) return null;
    return new Stadium(doc.id, doc.data());
  }

  static async findAll() {
    const snapshot = await db.collection('stadiums').where('active', '==', true).get();
    return snapshot.docs.map(doc => new Stadium(doc.id, doc.data()));
  }

  async update(data) {
    await db.collection('stadiums').doc(this.id).update({
      ...data,
      updatedAt: new Date()
    });
    this.data = { ...this.data, ...data };
    return this;
  }

  async delete() {
    await db.collection('stadiums').doc(this.id).update({
      active: false,
      updatedAt: new Date()
    });
    this.data.active = false;
    return this;
  }

  // Add shop to stadium
  async addShop(shopId) {
    await db.collection('stadiums').doc(this.id).update({
      shops: [...(this.data.shops || []), shopId],
      updatedAt: new Date()
    });
    return this;
  }

  // Update seat status
  async updateSeatStatus(sectionIndex, seatIndex, status) {
    const sections = [...this.data.sections];
    sections[sectionIndex].seats[seatIndex].status = status;
    
    await this.update({ sections });
    return this;
  }
}

module.exports = Stadium;
