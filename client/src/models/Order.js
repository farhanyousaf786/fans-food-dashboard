class Order {
    constructor(
        itemId,
        shopId,
        status = 0, // 0: Pending, 1: Accepted, 2: Preparing, 3: Ready, 4: Delivered, 5: Cancelled
        total,
        subtotal,
        deliveryFee = 0,
        discount = 0,
        paymentMethod = 0, // 0: Cash, 1: Card
        cart = [],
        restaurant = 'restaurants/default',
        isCompleted = false
    ) {
        this.itemId = itemId;
        this.shopId = shopId;
        this.status = status;
        this.total = total;
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.discount = discount;
        this.paymentMethod = paymentMethod;
        this.cart = cart;
        this.restaurant = restaurant;
        this.isCompleted = isCompleted;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            itemId: this.itemId,
            shopId: this.shopId,
            status: this.status,
            total: this.total,
            subtotal: this.subtotal,
            deliveryFee: this.deliveryFee,
            discount: this.discount,
            paymentMethod: this.paymentMethod,
            cart: this.cart,
            restaurant: this.restaurant,
            isCompleted: this.isCompleted,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data) {
        // Convert Firestore timestamps to JavaScript dates
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();

        const order = new Order(
            data.itemId,
            data.shopId,
            data.status,
            data.total,
            data.subtotal,
            data.deliveryFee,
            data.discount,
            data.paymentMethod,
            data.cart,
            data.restaurant,
            data.isCompleted
        );
        order.createdAt = createdAt;
        order.updatedAt = updatedAt;
        return order;
    }

    // Helper method to get status text
    static getStatusText(status) {
        const statusMap = {
            0: 'Pending',
            1: 'Accepted',
            2: 'Preparing',
            3: 'Ready',
            4: 'Delivered',
            5: 'Cancelled'
        };
        return statusMap[status] || 'Unknown';
    }

    // Helper method to get payment method text
    static getPaymentMethodText(method) {
        const methodMap = {
            0: 'Cash',
            1: 'Card'
        };
        return methodMap[method] || 'Unknown';
    }
}

export default Order;
