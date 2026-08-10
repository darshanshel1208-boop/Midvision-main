const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: FormData) {
    const res = await fetch(`${API_URL}/api/auth/register`, { method: "POST", body: data });
    if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
    return res.json();
  },
  
  async login(data: FormData) {
    const res = await fetch(`${API_URL}/api/auth/login`, { method: "POST", body: data });
    if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },

  // Reports
  async uploadReport(data: FormData) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/reports/upload`, { method: "POST", headers, body: data });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  
  async getReports() {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/reports`, { headers });
    if (!res.ok) throw new Error("Failed to fetch reports");
    return res.json();
  },

  // OCR
  async extractPrescription(data: FormData) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/reports/ocr`, { method: "POST", headers, body: data });
    if (!res.ok) throw new Error("OCR Extraction failed");
    return res.json();
  },

  // Chatbot
  async sendChatMessage(message: string) {
    const headers = getAuthHeaders();
    const data = new FormData();
    data.append("message", message);
    const res = await fetch(`${API_URL}/api/chatbot/message`, { method: "POST", headers, body: data });
    if (!res.ok) throw new Error("Chat failed");
    return res.json();
  },

  // Appointments & Slot Engine (SIH1383)
  async getAppointmentRecommendations(specialty: string, urgency: string = "normal", reportId: string | null = null) {
    const headers = getAuthHeaders();
    let url = `${API_URL}/api/appointments/recommendations?specialty=${encodeURIComponent(specialty)}&urgency=${encodeURIComponent(urgency)}`;
    if (reportId) url += `&report_id=${encodeURIComponent(reportId)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },

  async getSpecialtyRecommendation(reportId: string) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/appointments/specialty-recommendation/${reportId}`, { headers });
    if (!res.ok) throw new Error("Failed to get specialty recommendation");
    return res.json();
  },

  async bookAppointment(slotId: string, urgency: string = "normal", reportId: string | null = null) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/appointments/book`, { 
      method: "POST", 
      headers, 
      body: JSON.stringify({ slot_id: slotId, urgency, report_id: reportId }) 
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Booking failed");
    return res.json();
  },

  async cancelAppointment(appointmentId: string, reason: string = "User requested cancellation") {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Cancellation failed");
    return res.json();
  },

  async rescheduleAppointment(appointmentId: string, newSlotId: string) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/reschedule`, {
      method: "POST",
      headers,
      body: JSON.stringify({ new_slot_id: newSlotId })
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Rescheduling failed");
    return res.json();
  },

  async getAlternativeSlots(doctorId: string) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/appointments/alternatives?doctor_id=${doctorId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch alternatives");
    return res.json();
  },

  async getMyAppointments() {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/appointments/my-appointments`, { headers });
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
  },

  async getDoctorSchedule(doctorId: string, dateStr?: string) {
    const headers = getAuthHeaders();
    let url = `${API_URL}/api/appointments/doctor-schedule/${doctorId}`;
    if (dateStr) url += `?date_str=${dateStr}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch doctor schedule");
    return res.json();
  },

  async blockSlot(slotId: string, reason?: string) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/appointments/slots/block`, {
      method: "POST",
      headers,
      body: JSON.stringify({ slot_id: slotId, reason: reason || "Blocked" })
    });
    if (!res.ok) throw new Error("Failed to block slot");
    return res.json();
  },

  async requestDoctorLeave(data: { doctor_id: string; start_date: string; end_date: string; reason?: string }) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/appointments/leave`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit leave request");
    return res.json();
  },

  async getDashboardStats() {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/appointments/dashboard-stats`, { headers });
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
  },

  // Doctors
  async getDoctors(specialty?: string, hospitalId?: string) {
    const headers = getAuthHeaders();
    let url = `${API_URL}/api/doctors/?active_only=true`;
    if (specialty) url += `&specialty=${encodeURIComponent(specialty)}`;
    if (hospitalId) url += `&hospital_id=${encodeURIComponent(hospitalId)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch doctors");
    return res.json();
  },

  async createDoctor(data: any) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/doctors/`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Failed to create doctor");
    return res.json();
  },

  async updateDoctor(doctorId: string, data: any) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Failed to update doctor");
    return res.json();
  },

  async deactivateDoctor(doctorId: string) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error("Failed to deactivate doctor");
    return res.json();
  },

  // Notifications
  async getNotifications(unreadOnly: boolean = false) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/notifications/?unread_only=${unreadOnly}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async markNotificationRead(id: string) {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, { method: "POST", headers });
    if (!res.ok) throw new Error("Failed to mark notification read");
    return res.json();
  }
};
