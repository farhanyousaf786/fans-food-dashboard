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
        paymentMethod = 0, // 0: Cash, 1: Card
        insideDelivery = {},
        deliveryMethod = 'delivery',
        deliveryType = 'inside',
        orderCode = '',
        currency = 'ILS',
        outsideDelivery = {},
        pickupId = null
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
        this.insideDelivery = insideDelivery;
        this.deliveryMethod = deliveryMethod;
        this.deliveryType = deliveryType;
        this.orderCode = orderCode;
        this.currency = currency;
        this.outsideDelivery = outsideDelivery;
        this.pickupId = pickupId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            cart: this.cart,
            subtotal: parseFloat(this.subtotal || 0).toFixed(2),
            deliveryFee: parseFloat(this.deliveryFee || 0).toFixed(2),
            discount: parseFloat(this.discount || 0).toFixed(2),
            total: parseFloat(this.total || 0).toFixed(2),
            tipAmount: parseFloat(this.tipAmount || 0).toFixed(2),  // Ensure tip is properly formatted
            status: this.status,
            stadiumId: this.stadiumId,
            shopId: this.shopId,
            orderId: this.orderId,
            paymentMethod: this.paymentMethod || 0,
            userInfo: {
                userEmail: this.userInfo?.userEmail || '',
                userName: this.userInfo?.userName || '',
                userPhoneNo: this.userInfo?.userPhoneNo || '',
                userId: this.userInfo?.userId || ''
            },
            seatInfo: {
                roofNo: this.seatInfo?.roofNo || '',
                row: this.seatInfo?.row || '',
                seatNo: this.seatInfo?.seatNo || '',
                section: this.seatInfo?.section || '',
                seatDetails: this.seatInfo?.seatDetails || '',
                floor: this.seatInfo?.floor || '',
                room: this.seatInfo?.room || ''
            },
            insideDelivery: this.insideDelivery,
            outsideDelivery: this.outsideDelivery || {},
            pickupId: this.pickupId || null,
            deliveryMethod: this.deliveryMethod,
            deliveryType: this.deliveryType,
            orderCode: this.orderCode,
            currency: this.currency,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data) {
        // Convert Firestore timestamps to JavaScript dates
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();

        // Detect currency from multiple possible locations (top-level, insideDelivery, or first cart item)
        const detectedCurrency = data.currency ||
            data.insideDelivery?.currency ||
            (data.cart && data.cart.length > 0 ? data.cart[0].currency : null) ||
            'ILS';

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
            data.seatInfo || {},
            data.paymentMethod || 0,
            data.insideDelivery || {},
            data.deliveryMethod || 'delivery',
            data.deliveryType || 'inside',
            data.orderCode || '',
            detectedCurrency,
            data.outsideDelivery || {},
            data.pickupId || null
        );
        order.createdAt = createdAt;
        order.updatedAt = updatedAt;
        // Ensure tipAmount is parsed as float with 2 decimal places
        order.tipAmount = parseFloat((data.tipAmount || 0).toFixed(2));
        // Add deliveryUserId if it exists in the data
        order.deliveryUserId = data.deliveryUserId || data.deliveryUserID || null;
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
