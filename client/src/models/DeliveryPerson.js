// client/src/models/DeliveryPerson.js
import { Timestamp } from 'firebase/firestore';

class DeliveryPerson {
  constructor(
    email = '',
    phone = '',
    firstName = '',
    lastName = '',
    {
      image = null,
      fcmToken = '',
      createdAt = new Date(),
      updatedAt = new Date(),
      isActive = true,
      location = null, // Firestore GeoPoint or null
      docId = null,
    } = {}
  ) {
    this.email = email;
    this.phone = phone;
    this.firstName = firstName;
    this.lastName = lastName;
    this.image = image;

    this.fcmToken = fcmToken;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isActive = isActive;

    this.location = location;
    this.docId = docId; // Firestore document ID
    this.id = docId; // convenience alias used across the app
  }

  toFirestore() {
    return {
      email: this.email,
      phone: this.phone,
      firstName: this.firstName,
      lastName: this.lastName,
      image: this.image,

      fcmToken: this.fcmToken,
      createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
      updatedAt: Timestamp.fromDate(new Date()),
      isActive: this.isActive,

      location: this.location,
      type: 'deliveryPerson',
      docId: this.docId,
    };
  }

  static fromFirestore(data, id) {
    const model = new DeliveryPerson(
      data.email || '',
      data.phone || '',
      data.firstName || '',
      data.lastName || '',
      {
        image: data.image ?? null,
        fcmToken: data.fcmToken || '',
        createdAt: this.parseFirestoreDate(data.createdAt),
        updatedAt: this.parseFirestoreDate(data.updatedAt),
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        location: data.location ?? null,
        docId: id || data.docId || null,
      }
    );

    // Normalize IDs
    if (id) model.id = id;
    if (!model.docId) model.docId = id;

    return model;
  }

  static parseFirestoreDate(dateValue) {
    if (!dateValue) return new Date();
    if (typeof dateValue?.toDate === 'function') return dateValue.toDate();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    if (typeof dateValue === 'number') return new Date(dateValue);
    return new Date();
  }
}

export default DeliveryPerson;