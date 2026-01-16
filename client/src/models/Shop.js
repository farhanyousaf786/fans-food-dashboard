class Shop {
    constructor(name, location, floor, gate, description, admins, stadiumId, stadiumName, latitude = null, longitude = null, docId = null, imageUrl = null, deliveryFee = 0, deliveryFeeCurrency = 'ILS', insideDelivery = {}, outsideDelivery = {}, paymentOptions = {}) {
        this.name = name;
        this.location = location;
        this.floor = floor;
        this.gate = gate;
        this.description = description;
        this.admins = admins || []; // Array of admin user IDs
        this.stadiumId = stadiumId;
        this.stadiumName = stadiumName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.docId = docId;
        this.imageUrl = imageUrl;
        this.deliveryFee = parseFloat(deliveryFee) || 0;
        this.deliveryFeeCurrency = deliveryFeeCurrency || 'ILS';
        // Inside delivery options
        this.insideDelivery = {
            enabled: insideDelivery?.enabled || false,
            fee: parseFloat(insideDelivery?.fee) || 0,
            currency: insideDelivery?.currency || 'ILS',
            openTime: insideDelivery?.openTime || '09:00',
            closeTime: insideDelivery?.closeTime || '22:00',
            locations: insideDelivery?.locations || []
        };
        // Outside delivery options
        this.outsideDelivery = {
            enabled: outsideDelivery?.enabled || false,
            fee: parseFloat(outsideDelivery?.fee) || 0,
            currency: outsideDelivery?.currency || 'ILS',
            openTime: outsideDelivery?.openTime || '09:00',
            closeTime: outsideDelivery?.closeTime || '22:00',
            locations: outsideDelivery?.locations || []
        };
        // Payment options
        this.paymentOptions = {
            model: paymentOptions?.model || '2-way',
            platformFee: parseFloat(paymentOptions?.platformFee) || 0.12,
            vendorFee: parseFloat(paymentOptions?.vendorFee) || 0.88,
            hotelFee: parseFloat(paymentOptions?.hotelFee) || 0,
            deliveryDestination: paymentOptions?.deliveryDestination || 'platform',
            tipDestination: paymentOptions?.tipDestination || 'platform',
            vendorId: paymentOptions?.vendorId || '',
            hotelId: paymentOptions?.hotelId || null
        };
        // Shop availability flag (open/closed). Default to true for backwards compatibility
        this.shopAvailability = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Convert shop data to Firestore format
    toFirestore() {
        return {
            name: this.name,
            location: this.location,
            floor: this.floor,
            gate: this.gate,
            description: this.description,
            admins: this.admins,
            stadiumId: this.stadiumId,
            latitude: this.latitude,
            longitude: this.longitude,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            stadiumName: this.stadiumName,
            docId: this.docId,
            shopAvailability: this.shopAvailability,
            imageUrl: this.imageUrl,
            deliveryFee: this.deliveryFee,
            deliveryFeeCurrency: this.deliveryFeeCurrency,
            insideDelivery: this.insideDelivery,
            outsideDelivery: this.outsideDelivery,
            paymentOptions: this.paymentOptions
        };
    }

    // Create Shop instance from Firestore data
    static fromFirestore(data, id) {
        const shop = new Shop(
            data.name,
            data.location,
            data.floor,
            data.gate,
            data.description,
            data.admins,
            data.stadiumId,
            data.stadiumName,
            data.latitude,
            data.longitude,
            id,
            data.imageUrl,
            data.deliveryFee,
            data.deliveryFeeCurrency || 'ILS',
            data.insideDelivery,
            data.outsideDelivery,
            data.paymentOptions
        );
        shop.id = id;
        shop.createdAt = data.createdAt?.toDate() || new Date();
        shop.updatedAt = data.updatedAt?.toDate() || new Date();
        shop.shopAvailability = (typeof data.shopAvailability === 'boolean') ? data.shopAvailability : true;
        return shop;
    }
}

export default Shop;
