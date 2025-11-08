import { Timestamp } from 'firebase/firestore';

class Promotion {
    constructor(
        name = '',
        nameMap = {},
        promoText = '',
        promoTextMap = {},
        details = '',
        detailsMap = {},
        images = [],
        active = true,
        shopId = '',
        stadiumId = '',
        docId = null
    ) {
        this.name = name;
        this.nameMap = nameMap || {};
        this.promoText = promoText;
        this.promoTextMap = promoTextMap || {};
        this.details = details;
        this.detailsMap = detailsMap || {};
        this.images = images;
        this.active = active;
        this.shopId = shopId;
        this.stadiumId = stadiumId;
        this.docId = docId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            name: this.name,
            nameMap: this.nameMap,
            promoText: this.promoText,
            promoTextMap: this.promoTextMap,
            details: this.details,
            detailsMap: this.detailsMap,
            images: this.images,
            active: this.active,
            shopId: this.shopId,
            stadiumId: this.stadiumId,
            docId: this.docId,
            createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
            updatedAt: this.updatedAt instanceof Date ? Timestamp.fromDate(this.updatedAt) : this.updatedAt
        };
    }

    static fromFirestore(data, id) {
        const promotion = new Promotion(
            data.name || data?.nameMap?.en || '',
            data.nameMap || {},
            data.promoText || data?.promoTextMap?.en || '',
            data.promoTextMap || {},
            data.details || data?.detailsMap?.en || '',
            data.detailsMap || {},
            data.images || [],
            data.active !== undefined ? data.active : true,
            data.shopId || '',
            data.stadiumId || '',
            id
        );
        
        // Handle both Timestamp and string formats for createdAt/updatedAt
        promotion.createdAt = this.parseFirestoreDate(data.createdAt);
        promotion.updatedAt = this.parseFirestoreDate(data.updatedAt);
        
        return promotion;
    }

    static parseFirestoreDate(dateValue) {
        if (!dateValue) return new Date();
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
        }
        if (typeof dateValue === 'string') {
            return new Date(dateValue);
        }
        return dateValue instanceof Date ? dateValue : new Date();
    }
}

export default Promotion;
