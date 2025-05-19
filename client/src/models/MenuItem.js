class MenuItem {
    constructor(
        name,
        description,
        price,
        category,
        images = [],
        isAvailable = true,
        preparationTime = 15,
        shopId,
        stadiumId,
        customization = {
            toppings: [],
            extras: [],
            sauces: [],
            sizes: []
        },
        allergens = [],
        nutritionalInfo = {}
    ) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.images = images;
        this.isAvailable = isAvailable;
        this.preparationTime = preparationTime;
        this.shopId = shopId;
        this.stadiumId = stadiumId;
        this.customization = customization;
        this.allergens = allergens;
        this.nutritionalInfo = nutritionalInfo;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            name: this.name,
            description: this.description,
            price: this.price,
            category: this.category,
            images: this.images,
            isAvailable: this.isAvailable,
            preparationTime: this.preparationTime,
            shopId: this.shopId,
            stadiumId: this.stadiumId,
            customization: this.customization,
            allergens: this.allergens,
            nutritionalInfo: this.nutritionalInfo,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data) {
        const menuItem = new MenuItem(
            data.name,
            data.description,
            data.price,
            data.category,
            data.images || [],
            data.isAvailable,
            data.preparationTime,
            data.shopId,
            data.stadiumId,
            data.customization || {
                toppings: [],
                extras: [],
                sauces: [],
                sizes: []
            },
            data.allergens || [],
            data.nutritionalInfo || {}
        );
        menuItem.createdAt = data.createdAt?.toDate() || new Date();
        menuItem.updatedAt = data.updatedAt?.toDate() || new Date();
        return menuItem;
    }
}

export default MenuItem;