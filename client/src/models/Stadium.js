class Stadium {
    constructor(name, location, capacity, imageUrl, about) {
        this.name = name;
        this.location = location;
        this.capacity = capacity;
        this.imageUrl = imageUrl;
        this.about = about;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Convert Firestore document to Stadium object
    static fromFirestore(doc, id) {
        const data = doc.data();
        const stadium = new Stadium(
            data.name,
            data.location,
            data.capacity,
            data.imageUrl,
            data.about
        );
        stadium.id = id;
        stadium.createdAt = data.createdAt;
        stadium.updatedAt = data.updatedAt;
        return stadium;
    }

    // Convert Stadium object to Firestore document
    toFirestore() {
        return {
            name: this.name,
            location: this.location,
            capacity: this.capacity,
            imageUrl: this.imageUrl,
            about: this.about,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }
}

export default Stadium;
