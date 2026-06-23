export interface BusinessTemplate {
  id: string;
  title: string;
  emoji: string;
  fields: string[];
  generate: (values: Record<string, string>) => string;
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "order-received",
    title: "Order Received",
    emoji: "\u{1F4E6}",
    fields: ["customerName", "orderNumber", "itemName", "deliveryDate"],
    generate: (v) =>
      `Hello ${v.customerName}! 🎉\n\nThank you for your order #${v.orderNumber}.\n\n📦 Product: ${v.itemName}\n📅 Expected Delivery: ${v.deliveryDate}\n\nWe'll keep you updated on the status of your order. If you have any questions, feel free to reach out!\n\nBest regards`,
  },
  {
    id: "payment-pending",
    title: "Payment Pending",
    emoji: "\u{1F4B3}",
    fields: ["customerName", "amount", "dueDate", "invoiceNumber"],
    generate: (v) =>
      `Hi ${v.customerName},\n\nThis is a gentle reminder that your payment of ${v.amount} is due on ${v.dueDate}.\n\n📄 Invoice #: ${v.invoiceNumber}\n\nPlease process the payment at your earliest convenience. Let us know if you need any assistance.\n\nThank you!`,
  },
  {
    id: "shipment-dispatched",
    title: "Shipment Dispatched",
    emoji: "\u{1F69A}",
    fields: ["customerName", "trackingNumber", "carrier", "estimatedDelivery"],
    generate: (v) =>
      `Hello ${v.customerName}! 🚚\n\nGreat news! Your order has been dispatched.\n\n📦 Carrier: ${v.carrier}\n🚚 Tracking #: ${v.trackingNumber}\n📅 Estimated Delivery: ${v.estimatedDelivery}\n\nTrack your order using the tracking number above. Happy shopping!\n\nBest regards`,
  },
  {
    id: "delivery-completed",
    title: "Delivery Completed",
    emoji: "\u{2705}",
    fields: ["customerName", "orderNumber"],
    generate: (v) =>
      `Hi ${v.customerName}! ✅\n\nYour order #${v.orderNumber} has been delivered successfully.\n\nWe hope you love your purchase! If you have any issues, don't hesitate to contact us.\n\n⭐ We'd appreciate your feedback!\n\nThank you for choosing us!`,
  },
  {
    id: "refund-initiated",
    title: "Refund Initiated",
    emoji: "\u{1F4B0}",
    fields: ["customerName", "amount", "refundId", "expectedDays"],
    generate: (v) =>
      `Hi ${v.customerName},\n\nYour refund has been initiated successfully.\n\n💰 Amount: ${v.amount}\n📋 Refund ID: ${v.refundId}\n⏳ Expected Processing: ${v.expectedDays} business days\n\nThe amount will be credited to your original payment method. Please contact us if you have any questions.\n\nThank you for your patience!`,
  },
  {
    id: "thank-you",
    title: "Thank You",
    emoji: "\u{1F64F}",
    fields: ["customerName", "businessName", "offer"],
    generate: (v) =>
      `Dear ${v.customerName},\n\nThank you so much for your support! 🙏\n\nIt means the world to ${v.businessName}. We truly appreciate your trust in us.\n\n🎁 As a token of gratitude: ${v.offer}\n\nWe look forward to serving you again soon!\n\nWith love,\n${v.businessName} Team ❤️`,
  },
];
