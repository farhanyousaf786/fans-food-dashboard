class Order {
    constructor(
        cart = [],
        subtotal = 0,
        deliveryFee = 0,
        discount = 0,
        total = 0,
        status = 0, // 0: Pending, 1: Preparing, 2: Delivering, 3: Delivered, 4: Cancelled
        stadiumId = '',
        shopId = '',
        orderId = '',
        userInfo = {},
        seatInfo = {},
        paymentMethod = 0 // 0: Cash, 1: Card
    ) {
        this.cart = cart;
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.discount = discount;
        this.total = total;
        this.status = status;
        this.stadiumId = stadiumId;
        this.shopId = shopId;
        this.orderId = orderId;
        this.userInfo = userInfo;
        this.seatInfo = seatInfo;
        this.paymentMethod = paymentMethod;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            cart: this.cart,
            subtotal: this.subtotal,
            deliveryFee: this.deliveryFee,
            discount: this.discount,
            total: this.total,
            status: this.status,
            stadiumId: this.stadiumId,
            shopId: this.shopId,
            orderId: this.orderId,
            userInfo: {
                userEmail: this.userInfo.userEmail || '',
                userName: this.userInfo.userName || '',
                userPhoneNo: this.userInfo.userPhoneNo || '',
                userId: this.userInfo.userId || ''
            },
            seatInfo: {
                roofNo: this.seatInfo.roofNo || '',
                row: this.seatInfo.row || '',
                seatNo: this.seatInfo.seatNo || '',
                section: this.seatInfo.section || '',
                seatDetails: this.seatInfo.seatDetails || ''
            },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data) {
        // Convert Firestore timestamps to JavaScript dates
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();

        const order = new Order(
            data.cart || [],
            data.subtotal || 0,
            data.deliveryFee || 0,
            data.discount || 0,
            data.total || 0,
            data.status || 0,
            data.stadiumId || '',
            data.shopId || '',
            data.orderId || '',
            data.userInfo || {},
            data.seatInfo || {}
        );
        order.createdAt = createdAt;
        order.updatedAt = updatedAt;
        return order;
    }

    // Helper method to get status text
    static getStatusText(status) {
        const statusMap = {
            0: 'Pending',
            1: 'Preparing',
            2: 'Delivering',
            3: 'Delivered',
            4: 'Cancelled'
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
