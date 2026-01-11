class Room {
    constructor(config, stadiumId) {
        this.floors = config.floors || [];
        this.sections = config.sections || [];
        this.roomsPerFloor = config.roomsPerFloor || {};
        this.stadiumId = stadiumId;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Convert Firestore document to Room object
    static fromFirestore(doc, id) {
        const data = doc.data();
        const room = new Room({
            floors: data.floors || [],
            sections: data.sections || [],
            roomsPerFloor: data.roomsPerFloor || {}
        }, data.stadiumId);
        room.id = id;
        room.createdAt = data.createdAt;
        room.updatedAt = data.updatedAt;
        return room;
    }

    // Convert Room object to Firestore document
    toFirestore() {
        return {
            floors: this.floors,
            sections: this.sections,
            roomsPerFloor: this.roomsPerFloor,
            stadiumId: this.stadiumId,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }

    // Generate room list for display (client-side only)
    static generateRoomList(floors, sections, roomsPerFloor) {
        const rooms = [];
        const normalizedFloors = Array.isArray(floors) ? floors : [];
        const normalizedSections = Array.isArray(sections) ? sections : [];
        const effectiveSections = normalizedSections.length ? normalizedSections : [''];
        
        normalizedFloors.forEach(floor => {
            effectiveSections.forEach(section => {
                const roomsOnFloor = roomsPerFloor[floor] || 0;
                for (let room = 1; room <= roomsOnFloor; room++) {
                    const sectionPrefix = section ? section.toUpperCase() : '';
                    const roomNumber = `${sectionPrefix}${floor}${room.toString().padStart(2, '0')}`;
                    rooms.push({
                        roomNumber,
                        section: section ? section.toUpperCase() : '',
                        floor,
                        roomIndex: room,
                        sectionLabel: section ? `Section ${section.toUpperCase()}` : 'No Section',
                        floorLabel: `Floor ${floor}`,
                        roomLabel: `Room ${room.toString().padStart(2, '0')}`
                    });
                }
            });
        });
        
        return rooms;
    }

    // Calculate total rooms
    static getTotalRooms(floors, sections, roomsPerFloor) {
        const normalizedFloors = Array.isArray(floors) ? floors : [];
        const normalizedSections = Array.isArray(sections) ? sections : [];
        const sectionCount = normalizedSections.length || 1;
        return normalizedFloors.reduce((total, floor) => {
            return total + (sectionCount * (roomsPerFloor[floor] || 0));
        }, 0);
    }

    // Get available floors (1-50)
    static getAvailableFloors() {
        const floors = [];
        for (let i = 1; i <= 50; i++) {
            floors.push({
                value: i.toString(),
                label: `Floor ${i}`
            });
        }
        return floors;
    }

    // Get available sections (A-Z)
    static getAvailableSections() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return alphabet.split('').map(letter => ({
            value: letter.toLowerCase(),
            label: `Section ${letter}`
        }));
    }
}

export default Room;
