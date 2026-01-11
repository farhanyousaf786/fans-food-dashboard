import { Timestamp } from 'firebase/firestore';

class MenuItem {
    constructor(
        name,
        nameMap = {},
        description,
        descriptionMap = {},
        price,
        category, // categoryId string
        images = [],
        isAvailable = true,
        preparationTime = 15,
        shopIds = [],
        stadiumId,
        docId = null,
        customization = {
            options: []
        },
        allergens = [],
        nutritionalInfo = {},
        foodType = {
            halal: false,
            kosher: false,
            vegan: false
        },
        currency = 'USD',
        isCombo = false,
        comboItemIds = []
    ) {
        this.name = name;
        this.nameMap = nameMap || {};
        this.description = description;
        this.descriptionMap = descriptionMap || {};
        this.price = price;
        this.category = category; // store categoryId
        this.images = images;
        this.isAvailable = isAvailable;
        this.preparationTime = preparationTime;
        this.shopIds = Array.isArray(shopIds) ? shopIds : [shopIds].filter(Boolean);
        this.stadiumId = stadiumId;
        this.docId = docId;
        this.customization = customization;
        this.allergens = allergens;
        this.nutritionalInfo = nutritionalInfo;
        this.foodType = foodType;
        this.currency = currency;
        this.isCombo = isCombo;
        this.comboItemIds = comboItemIds || [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            name: this.name,
            nameMap: this.nameMap,
            description: this.description,
            descriptionMap: this.descriptionMap,
            price: this.price,
            category: this.category, // categoryId
            images: this.images,
            isAvailable: this.isAvailable,
            preparationTime: this.preparationTime,
            shopIds: this.shopIds,
            stadiumId: this.stadiumId,
            customization: this.customization,
            allergens: this.allergens,
            nutritionalInfo: this.nutritionalInfo,
            foodType: this.foodType,
            currency: this.currency,
            isCombo: this.isCombo,
            comboItemIds: this.comboItemIds,
            docId: this.docId,
            createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
            updatedAt: this.updatedAt instanceof Date ? Timestamp.fromDate(this.updatedAt) : this.updatedAt
        };
    }

    static fromFirestore(data, id) {
        const menuItem = new MenuItem(
            data.name || data?.nameMap?.en || '',
            data.nameMap || {},
            data.description || data?.descriptionMap?.en || '',
            data.descriptionMap || {},
            data.price,
            data.category, // categoryId
            data.images || [],
            data.isAvailable,
            data.preparationTime,
            data.shopIds || data.shopId ? (Array.isArray(data.shopIds) ? data.shopIds : [data.shopId]) : [],
            data.stadiumId,
            data.docId || id,
            data.customization || {
                options: []
            },
            data.allergens || [],
            data.nutritionalInfo || {},
            data.foodType || {
                halal: false,
                kosher: false,
                vegan: false
            },
            data.currency || 'USD',
            data.isCombo || false,
            data.comboItemIds || []
        );
        // Also store the Firestore document ID on the instance for convenience
        if (id) menuItem.id = id;
        if (!menuItem.docId) menuItem.docId = id;

        // Handle both Timestamp and string formats for createdAt/updatedAt
        menuItem.createdAt = this.parseFirestoreDate(data.createdAt);
        menuItem.updatedAt = this.parseFirestoreDate(data.updatedAt);

        return menuItem;
    }

    static parseFirestoreDate(dateValue) {
        if (!dateValue) return new Date();

        // If it's a Firestore Timestamp
        if (typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
        }

        // If it's already a Date object
        if (dateValue instanceof Date) {
            return dateValue;
        }

        // If it's a string representation
        if (typeof dateValue === 'string') {
            return new Date(dateValue);
        }

        // If it's a number (timestamp)
        if (typeof dateValue === 'number') {
            return new Date(dateValue);
        }

        // Fallback to current date
        return new Date();
    }
}

export default MenuItem;