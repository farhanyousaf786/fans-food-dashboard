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
        options = [],
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
        this.options = options;
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
            options: this.options,
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
            data.imageUrl,
            data.isAvailable,
            data.preparationTime,
            data.shopId,
            data.options,
            data.allergens,
            data.nutritionalInfo
        );
        menuItem.createdAt = data.createdAt.toDate();
        menuItem.updatedAt = data.updatedAt.toDate();
        return menuItem;
    }
}

export default MenuItem;