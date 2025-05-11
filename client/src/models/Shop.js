class Shop {
    constructor(name, location, floor, gate, description, admins, stadiumId) {
        this.name = name;
        this.location = location;
        this.floor = floor;
        this.gate = gate;
        this.description = description;
        this.admins = admins || []; // Array of admin user IDs
        this.stadiumId = stadiumId;
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
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
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
            data.stadiumId
        );
        shop.id = id;
        shop.createdAt = data.createdAt?.toDate() || new Date();
        shop.updatedAt = data.updatedAt?.toDate() || new Date();
        return shop;
    }
}

export default Shop;
