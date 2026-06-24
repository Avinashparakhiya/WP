export interface SmartTemplateCategory {
  id: string;
  title: string;
  emoji: string;
  templates: {
    title: string;
    prompt: string;
  }[];
}

export const SMART_TEMPLATE_CATEGORIES: SmartTemplateCategory[] = [
  {
    id: "doctor",
    title: "Doctor",
    emoji: "\u{1F468}\u{200D}\u{2695}\u{FE0F}",
    templates: [
      {
        title: "Appointment Reminder",
        prompt:
          "Write a professional WhatsApp appointment reminder message for a doctor's clinic. Include patient name placeholder, date, time, and address. Keep it warm and professional.",
      },
      {
        title: "Test Results",
        prompt:
          "Write a professional WhatsApp message for a doctor to share test results with a patient. Include placeholders for patient name, test type, and brief result summary. Be empathetic and clear.",
      },
      {
        title: "Follow-up Message",
        prompt:
          "Write a follow-up WhatsApp message for a doctor to check on a patient after treatment. Include placeholders for patient name and treatment type.",
      },
      {
        title: "Welcome Message",
        prompt:
          "Write a welcome WhatsApp message for a new patient at a doctor's clinic. Include clinic name, hours, and contact info placeholders.",
      },
      {
        title: "Prescription Note",
        prompt:
          "Write a WhatsApp message from a doctor about medication instructions. Include placeholders for medication name, dosage, and schedule.",
      },
    ],
  },
  {
    id: "lawyer",
    title: "Lawyer",
    emoji: "\u{1F468}\u{200D}\u{2696}\u{FE0F}",
    templates: [
      {
        title: "Case Update",
        prompt:
          "Write a professional WhatsApp case update message for a lawyer to send to a client. Include placeholders for client name, case type, and current status.",
      },
      {
        title: "Consultation Request",
        prompt:
          "Write a WhatsApp message for a law firm requesting a consultation. Include placeholders for firm name, area of expertise, and scheduling info.",
      },
      {
        title: "Document Reminder",
        prompt:
          "Write a professional WhatsApp reminder for a lawyer requesting documents from a client. Include placeholders for document names and deadline.",
      },
      {
        title: "Court Date Notice",
        prompt:
          "Write a formal WhatsApp message for a lawyer informing a client about a court date. Include placeholders for date, time, and location.",
      },
      {
        title: "Fee Estimate",
        prompt:
          "Write a professional WhatsApp message for a lawyer providing a fee estimate. Include placeholders for service type and estimated amount.",
      },
    ],
  },
  {
    id: "freelancer",
    title: "Freelancer",
    emoji: "\u{1F4BB}",
    templates: [
      {
        title: "Project Proposal",
        prompt:
          "Write a WhatsApp message for a freelancer sending a project proposal. Include placeholders for client name, project type, timeline, and estimated cost.",
      },
      {
        title: "Progress Update",
        prompt:
          "Write a WhatsApp progress update message from a freelancer to a client. Include placeholders for project name and completion percentage.",
      },
      {
        title: "Invoice Follow-up",
        prompt:
          "Write a polite WhatsApp invoice follow-up from a freelancer. Include placeholders for invoice number, amount, and due date.",
      },
      {
        title: "Work Delivered",
        prompt:
          "Write a WhatsApp message from a freelancer informing a client that work has been delivered. Include placeholders for deliverable name and revision policy.",
      },
      {
        title: "Thank You & Review",
        prompt:
          "Write a WhatsApp message from a freelancer thanking a client after project completion and requesting a testimonial.",
      },
    ],
  },
  {
    id: "shop-owner",
    title: "Shop Owner",
    emoji: "\u{1F3EA}",
    templates: [
      {
        title: "New Arrival",
        prompt:
          "Write an exciting WhatsApp announcement for a shop about new arrivals. Include placeholders for product name, price range, and shop name.",
      },
      {
        title: "Flash Sale",
        prompt:
          "Write an urgent WhatsApp flash sale announcement for a shop. Include placeholders for discount percentage, sale duration, and shop name.",
      },
      {
        title: "Order Confirmation",
        prompt:
          "Write a WhatsApp order confirmation for a shop. Include placeholders for customer name, items, and pickup/delivery time.",
      },
      {
        title: "Restock Alert",
        prompt:
          "Write a WhatsApp restock alert for a popular item at a shop. Include placeholders for product name and availability.",
      },
      {
        title: "Thank You Purchase",
        prompt:
          "Write a WhatsApp thank-you message after a purchase from a shop. Include placeholders for customer name and shop name.",
      },
    ],
  },
  {
    id: "real-estate",
    title: "Real Estate",
    emoji: "\u{1F3E0}",
    templates: [
      {
        title: "Property Listing",
        prompt:
          "Write a WhatsApp property listing message for a real estate agent. Include placeholders for property type, location, bedrooms, price, and key features.",
      },
      {
        title: "Viewing Invitation",
        prompt:
          "Write a WhatsApp viewing invitation from a real estate agent. Include placeholders for property address, date, and time.",
      },
      {
        title: "Price Update",
        prompt:
          "Write a WhatsApp price update message from a real estate agent to interested buyers. Include placeholders for property name and new price.",
      },
      {
        title: "Site Visit Follow-up",
        prompt:
          "Write a WhatsApp follow-up from a real estate agent after a property visit. Include placeholders for client name and property address.",
      },
      {
        title: "Welcome to New Home",
        prompt:
          "Write a warm WhatsApp welcome message from a real estate agent after a property purchase. Include placeholders for client name and property address.",
      },
    ],
  },
  {
    id: "teacher",
    title: "Teacher",
    emoji: "\u{1F9D1}\u{200D}\u{1F3EB}",
    templates: [
      {
        title: "Homework Assignment",
        prompt:
          "Write a professional WhatsApp message from a teacher sharing a homework assignment. Include placeholders for subject, topic, due date, and instructions.",
      },
      {
        title: "Parent-Teacher Meeting",
        prompt:
          "Write a polite WhatsApp message from a teacher inviting a parent to a parent-teacher meeting. Include placeholders for student name, date, time, and meeting link/location.",
      },
      {
        title: "Class Update",
        prompt:
          "Write an urgent WhatsApp announcement from a teacher/tutor about a class schedule change or cancellation. Include placeholders for subject, original time, and new time.",
      },
      {
        title: "Exam Results Notice",
        prompt:
          "Write a supportive WhatsApp message from a teacher notifying a parent/student about exam results being published. Include placeholders for subject and where to check the grades.",
      },
      {
        title: "Fee Reminder",
        prompt:
          "Write a polite WhatsApp reminder from a tutor about monthly tuition fees. Include placeholders for student name, fee amount, and payment deadline.",
      },
    ],
  },
  {
    id: "fitness",
    title: "Fitness Coach",
    emoji: "\u{1F3CB}\u{FE0F}\u{200D}\u{2642}\u{FE0F}",
    templates: [
      {
        title: "Workout Schedule",
        prompt:
          "Write an encouraging WhatsApp message from a fitness coach sharing a workout routine. Include placeholders for client name, workout focus, and duration.",
      },
      {
        title: "Nutrition Plan",
        prompt:
          "Write a friendly WhatsApp reminder from a trainer about a diet or hydration plan. Include placeholders for meal type, recommended foods, and tips.",
      },
      {
        title: "Session Confirmation",
        prompt:
          "Write a WhatsApp confirmation message for a personal training session. Include placeholders for client name, date, and time.",
      },
      {
        title: "Progress Milestone",
        prompt:
          "Write a motivational WhatsApp message celebrating a client's fitness milestone. Include placeholders for client name, goal achieved, and encouragement.",
      },
    ],
  },
  {
    id: "salon",
    title: "Salon Owner",
    emoji: "\u{1F487}\u{200D}\u{2640}\u{FE0F}",
    templates: [
      {
        title: "Booking Confirmation",
        prompt:
          "Write a friendly WhatsApp booking confirmation for a salon appointment. Include placeholders for customer name, service type, date, and time.",
      },
      {
        title: "Promo Discount",
        prompt:
          "Write a beautiful WhatsApp marketing message for a beauty salon discount. Include placeholders for discount amount, service names, and expiration date.",
      },
      {
        title: "Feedback Request",
        prompt:
          "Write a polite WhatsApp message from a salon therapist asking a client for review/feedback after a service. Include salon name placeholder.",
      },
    ],
  },
];
