class PickUpPoint {
    constructor(name, area, description, location, stadiumId) {
        this.name = name;
        this.area = area;
        this.description = description;
        this.location = location;
        this.stadiumId = stadiumId;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Convert Firestore document to PickUpPoint object
    static fromFirestore(doc, id) {
        const data = doc.data();
        const pickUpPoint = new PickUpPoint(
            data.name,
            data.area,
            data.description,
            data.location,
            data.stadiumId
        );
        pickUpPoint.id = id;
        pickUpPoint.createdAt = data.createdAt;
        pickUpPoint.updatedAt = data.updatedAt;
        return pickUpPoint;
    }

    // Convert PickUpPoint object to Firestore document
    toFirestore() {
        return {
            name: this.name,
            area: this.area,
            description: this.description,
            location: this.location,
            stadiumId: this.stadiumId,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }
}

export default PickUpPoint;
