class Stadium {
    constructor(name, location, capacity, imageUrl, about, latitude = null, longitude = null, availableRooms = false, availableSections = false, availablePickupPoints = false, availableShops = false, availableStands = false, availableFloors = false, availableSeats = false, availableTickets = false) {
        this.name = name;
        this.location = location;
        this.capacity = capacity;
        this.imageUrl = imageUrl;
        this.about = about;
        this.latitude = latitude;
        this.longitude = longitude;
        this.availableRooms = availableRooms;
        this.availableSections = availableSections;
        this.availablePickupPoints = availablePickupPoints;
        this.availableShops = availableShops;
        this.availableStands = availableStands;
        this.availableFloors = availableFloors;
        this.availableSeats = availableSeats;
        this.availableTickets = availableTickets;
        this.color = '#3D70FF';
        this.secondaryColor = '';
        this.logoUrl = '';
        this.bannerUrl = '';
        this.brandName = '';
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    static fromFirestore(doc, id) {
        const data = doc.data();
        const stadium = new Stadium(
            data.name,
            data.location,
            data.capacity,
            data.imageUrl,
            data.about,
            data.latitude,
            data.longitude,
            data.availableRooms,
            data.availableSections,
            data.availablePickupPoints,
            data.availableShops,
            data.availableStands,
            data.availableFloors,
            data.availableSeats,
            data.availableTickets
        );
        stadium.id = id;
        stadium.color = data.color || '#3D70FF';
        stadium.secondaryColor = data.secondaryColor || '';
        stadium.logoUrl = data.logoUrl || '';
        stadium.bannerUrl = data.bannerUrl || '';
        stadium.brandName = data.brandName || '';
        stadium.createdAt = data.createdAt;
        stadium.updatedAt = data.updatedAt;
        return stadium;
    }

    toFirestore() {
        return {
            name: this.name,
            location: this.location,
            capacity: this.capacity,
            imageUrl: this.imageUrl,
            about: this.about,
            latitude: this.latitude,
            longitude: this.longitude,
            availableRooms: this.availableRooms,
            availableSections: this.availableSections,
            availablePickupPoints: this.availablePickupPoints,
            availableShops: this.availableShops,
            availableStands: this.availableStands,
            availableFloors: this.availableFloors,
            availableSeats: this.availableSeats,
            availableTickets: this.availableTickets,
            color: this.color || '#3D70FF',
            secondaryColor: this.secondaryColor || '',
            logoUrl: this.logoUrl || '',
            bannerUrl: this.bannerUrl || '',
            brandName: this.brandName || '',
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }
}

export default Stadium;
