class Floors {
    constructor(floors, stadiumId) {
        this.floors = typeof floors === 'number' ? floors : parseInt(floors, 10) || 0;
        this.stadiumId = stadiumId;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    static fromFirestore(doc, id) {
        const data = doc.data();
        const model = new Floors(data.floors || 0, id);
        model.createdAt = data.createdAt;
        model.updatedAt = data.updatedAt;
        return model;
    }

    toFirestore() {
        return {
            floors: this.floors,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }
}

export default Floors;
